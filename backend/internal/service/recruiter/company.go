package recruiter

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/enrichment"
)

type CompanyScraper struct {
	firecrawl *enrichment.FirecrawlClient
	gemini    *enrichment.GeminiClient
}

func NewCompanyScraper(firecrawl *enrichment.FirecrawlClient, gemini *enrichment.GeminiClient) *CompanyScraper {
	return &CompanyScraper{firecrawl: firecrawl, gemini: gemini}
}

type CompanyInput struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	LinkedInURL string `json:"linkedin_url"`
	WebsiteURL  string `json:"website_url"`
}

func (c *CompanyInput) Normalize() {
	c.Name = strings.TrimSpace(c.Name)
	c.Email = strings.TrimSpace(strings.ToLower(c.Email))
	c.LinkedInURL = normalizeURL(c.LinkedInURL)
	c.WebsiteURL = normalizeURL(c.WebsiteURL)
}

func (s *CompanyScraper) Resolve(ctx context.Context, store *repository.Store, input CompanyInput) (*models.RecruiterCompany, bool, error) {
	input.Normalize()
	if cached, err := store.FindRecruiterCompanyByURL(ctx, input.LinkedInURL, input.WebsiteURL); err == nil {
		return cached, true, nil
	}

	pageURL := input.LinkedInURL
	if pageURL == "" {
		pageURL = input.WebsiteURL
	}
	if pageURL == "" {
		return nil, false, fmt.Errorf("company page url required")
	}

	company := &models.RecruiterCompany{
		Name:        input.Name,
		Email:       input.Email,
		LinkedInURL: input.LinkedInURL,
		WebsiteURL:  input.WebsiteURL,
		ScrapedAt:   time.Now().UTC(),
	}

	if s.firecrawl != nil && s.firecrawl.Enabled() {
		scraped, err := s.firecrawl.Scrape(ctx, pageURL)
		if err == nil && scraped != nil {
			s.applyScrape(company, scraped)
		}
	}

	if company.Name == "" {
		company.Name = input.Name
	}
	if company.Description == "" && s.gemini != nil && s.gemini.Enabled() {
		_ = s.enrichWithGemini(ctx, company, pageURL)
	}

	return company, false, nil
}

func normalizeURL(raw string) string {
	raw = strings.TrimSpace(strings.ToLower(raw))
	raw = strings.TrimSuffix(raw, "/")
	if raw == "" {
		return ""
	}
	if !strings.HasPrefix(raw, "http://") && !strings.HasPrefix(raw, "https://") {
		raw = "https://" + raw
	}
	return raw
}

func (s *CompanyScraper) applyScrape(company *models.RecruiterCompany, scraped *enrichment.ScrapeResult) {
	if scraped.Title != "" && company.Name == "" {
		company.Name = cleanCompanyTitle(scraped.Title)
	}
	markdown := scraped.Markdown
	text := strings.ToLower(markdown)
	for _, line := range strings.Split(markdown, "\n") {
		line = strings.TrimSpace(line)
		lower := strings.ToLower(line)
		if company.Industry == "" && strings.Contains(lower, "industry") {
			company.Industry = strings.TrimSpace(lastSegment(line))
		}
		if company.Size == "" && (strings.Contains(lower, "company size") || strings.Contains(lower, "employees")) {
			company.Size = strings.TrimSpace(lastSegment(line))
		}
		if company.Location == "" && strings.Contains(lower, "headquarters") {
			company.Location = strings.TrimSpace(lastSegment(line))
		}
	}
	if len(markdown) > 280 && company.Description == "" {
		company.Description = strings.TrimSpace(markdown[:280]) + "…"
	}
	if company.EmployeeCount == "" && strings.Contains(text, "employees on linkedin") {
		company.EmployeeCount = "listed on LinkedIn"
	}
}

func cleanCompanyTitle(title string) string {
	title = strings.TrimSpace(title)
	for _, suffix := range []string{" | LinkedIn", " - LinkedIn", " | linkedin"} {
		title = strings.TrimSuffix(title, suffix)
	}
	return strings.TrimSpace(title)
}

func lastSegment(line string) string {
	parts := strings.SplitN(line, ":", 2)
	if len(parts) == 2 {
		return parts[1]
	}
	return line
}

func (s *CompanyScraper) enrichWithGemini(ctx context.Context, company *models.RecruiterCompany, pageURL string) error {
	prompt := fmt.Sprintf(`Extract company profile fields from this page URL: %s
Return JSON with keys: name, industry, size, location, description, website_url`, pageURL)
	raw, err := s.gemini.GenerateStructuredJSON(ctx, "You extract structured company data.", prompt, 1024)
	if err != nil {
		return err
	}
	var parsed struct {
		Name        string `json:"name"`
		Industry    string `json:"industry"`
		Size        string `json:"size"`
		Location    string `json:"location"`
		Description string `json:"description"`
		WebsiteURL  string `json:"website_url"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return err
	}
	if company.Name == "" {
		company.Name = parsed.Name
	}
	if company.Industry == "" {
		company.Industry = parsed.Industry
	}
	if company.Size == "" {
		company.Size = parsed.Size
	}
	if company.Location == "" {
		company.Location = parsed.Location
	}
	if company.Description == "" {
		company.Description = parsed.Description
	}
	if company.WebsiteURL == "" {
		company.WebsiteURL = normalizeURL(parsed.WebsiteURL)
	}
	return nil
}

func AttachCompanyToUser(ctx context.Context, store *repository.Store, userID primitive.ObjectID, company *models.RecruiterCompany) error {
	company.CreatedBy = userID
	if err := store.UpsertRecruiterCompany(ctx, company); err != nil {
		return err
	}
	return store.UpdateUserFields(ctx, userID, bson.M{
		"recruiter_company_id":          company.ID,
		"company_email":                 company.Email,
		"recruiter_onboarding_complete": true,
	})
}
