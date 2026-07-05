package enrichment

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
)

type portfolioExtract struct {
	FlagshipProjects []struct {
		Name     string `json:"name"`
		URL      string `json:"url"`
		Summary  string `json:"summary"`
		Category string `json:"category"`
	} `json:"flagship_projects"`
	OtherHighlights []struct {
		Title    string `json:"title"`
		Category string `json:"category"`
		URL      string `json:"url"`
	} `json:"other_highlights"`
}

// SupplementSparseEvidence discovers portfolio/LinkedIn work when public GitHub stats under-represent someone.
func (a *Agent) SupplementSparseEvidence(ctx context.Context, profile *models.Profile) ([]models.EvidenceItem, error) {
	if profile == nil || !isSparsePublicGitHub(profile) {
		return nil, nil
	}
	if !a.firecrawl.Enabled() || !a.aiEnabled() {
		return nil, nil
	}

	publicEmail := a.resolvePublicEmail(ctx, profile)
	candidates := discoverPortfolioURLs(profile, publicEmail)
	if len(candidates) == 0 && a.tavily.Enabled() {
		query := portfolioSearchQuery(profile, publicEmail)
		hits, err := a.tavily.Search(ctx, query, 4)
		if err == nil {
			hits = filterSearchHits(profile, hits)
			for _, hit := range hits {
				if isPortfolioLikeURL(hit.URL) {
					candidates = append(candidates, linkEntry{Platform: inferPortfolioPlatform(hit.URL), URL: hit.URL})
				}
			}
		}
	}
	if len(candidates) == 0 {
		return nil, nil
	}

	now := time.Now().UTC()
	var corpus strings.Builder
	corpus.WriteString(fmt.Sprintf("Person: %s (@%s)\n", profile.DisplayName, profile.Handle))

	scrapeLimit := 2
	for _, link := range candidates {
		if scrapeLimit <= 0 {
			break
		}
		scraped, err := a.firecrawl.Scrape(ctx, link.URL)
		if err != nil {
			continue
		}
		scrapeLimit--
		corpus.WriteString(fmt.Sprintf("\n--- %s (%s) ---\n%s\n", link.Platform, link.URL, truncate(scraped.Markdown, 8000)))
	}

	if corpus.Len() < 80 {
		return nil, nil
	}

	raw, err := a.generatePortfolioExtract(ctx, corpus.String())
	if err != nil {
		return nil, err
	}

	return mapPortfolioExtract(raw, now), nil
}

func isSparsePublicGitHub(profile *models.Profile) bool {
	stars, flagshipStars := 0, 0
	hasFlagship := false
	for _, e := range profile.Evidence {
		if e.Platform != "github" {
			continue
		}
		switch e.Type {
		case "open_source_impact":
			stars = maxInt(e.Count, stars)
		case "flagship_project":
			hasFlagship = true
			flagshipStars = maxInt(e.Count, flagshipStars)
		}
	}
	if stars >= 500 && flagshipStars >= 100 {
		return false
	}
	return stars < 100 || flagshipStars < 25 || !hasFlagship
}

func discoverPortfolioURLs(profile *models.Profile, publicEmail string) []linkEntry {
	seen := map[string]bool{}
	var out []linkEntry
	add := func(platform, rawURL string) {
		rawURL = strings.TrimSpace(rawURL)
		if rawURL == "" || seen[rawURL] || strings.Contains(rawURL, "github.com") {
			return
		}
		if !strings.HasPrefix(rawURL, "http") {
			rawURL = "https://" + rawURL
		}
		seen[rawURL] = true
		out = append(out, linkEntry{Platform: platform, URL: rawURL})
	}

	for _, link := range profile.SocialLinks {
		switch link.Platform {
		case "website", "portfolio", "blog":
			add("portfolio", link.URL)
		case "linkedin":
			add("linkedin", link.URL)
		}
	}

	if publicEmail != "" {
		parts := strings.Split(publicEmail, "@")
		if len(parts) == 2 {
			domain := strings.ToLower(parts[1])
			if domain != "" && !isFreeEmailDomain(domain) {
				add("portfolio", "https://"+domain)
			}
		}
	}
	return out
}

func portfolioSearchQuery(profile *models.Profile, publicEmail string) string {
	name := strings.TrimSpace(profile.DisplayName)
	parts := []string{name, profile.Handle, "developer portfolio"}
	if publicEmail != "" {
		parts = append(parts, publicEmail)
	}
	return strings.Join(parts, " ")
}

func isPortfolioLikeURL(raw string) bool {
	raw = strings.ToLower(raw)
	if strings.Contains(raw, "linkedin.com/in/") {
		return true
	}
	for _, block := range []string{"github.com", "twitter.com", "x.com", "facebook.com", "instagram.com", "medium.com/@"} {
		if strings.Contains(raw, block) {
			return false
		}
	}
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return false
	}
	return true
}

func inferPortfolioPlatform(raw string) string {
	if strings.Contains(strings.ToLower(raw), "linkedin.com") {
		return "linkedin"
	}
	return "portfolio"
}

func isFreeEmailDomain(domain string) bool {
	for _, d := range []string{"gmail.com", "googlemail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "proton.me", "protonmail.com"} {
		if domain == d {
			return true
		}
	}
	return false
}

func (a *Agent) generatePortfolioExtract(ctx context.Context, corpus string) (*portfolioExtract, error) {
	systemPrompt := `You extract structured career evidence from portfolio, personal site, or LinkedIn page text.
Return JSON only with keys flagship_projects and other_highlights.
flagship_projects: up to 2 standout projects (coding or non-coding) with name, url, summary, category (coding|product|research|other).
other_highlights: up to 4 additional items (talks, publications, leadership, awards, community) with title, category (talk|publication|leadership|award|community|other), url.
Only include work explicitly mentioned in the text. Do not invent employers, metrics, or projects.`
	userPrompt := "Extract notable projects and non-coding work from:\n\n" + corpus

	var raw []byte
	var err error
	if a.gemini != nil && a.gemini.Enabled() {
		raw, err = a.gemini.GenerateStructuredJSON(ctx, systemPrompt, userPrompt, 2048)
	} else if a.nvidia != nil && a.nvidia.Enabled() {
		raw, err = a.nvidia.generateJSON(ctx, systemPrompt, userPrompt, 2048)
	}
	if err != nil {
		return nil, err
	}

	var out portfolioExtract
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("parse portfolio extract: %w", err)
	}
	return &out, nil
}

func mapPortfolioExtract(extract *portfolioExtract, now time.Time) []models.EvidenceItem {
	if extract == nil {
		return nil
	}
	var items []models.EvidenceItem

	for i, project := range extract.FlagshipProjects {
		name := strings.TrimSpace(project.Name)
		if name == "" {
			continue
		}
		platform := "portfolio"
		if strings.Contains(strings.ToLower(project.URL), "linkedin.com") {
			platform = "linkedin"
		}
		items = append(items, models.EvidenceItem{
			Type:        "flagship_project",
			Title:       fmt.Sprintf("Flagship project: %s", name),
			Description: strings.TrimSpace(project.Summary),
			Platform:    platform,
			Verified:    false,
			Count:       1,
			URL:         strings.TrimSpace(project.URL),
			OccurredAt:  now,
		})
		if i >= 1 {
			break
		}
	}

	for _, highlight := range extract.OtherHighlights {
		title := strings.TrimSpace(highlight.Title)
		if title == "" {
			continue
		}
		evidenceType := "claimed_project"
		switch strings.ToLower(highlight.Category) {
		case "talk":
			evidenceType = "conference_talk"
		case "publication":
			evidenceType = "publication"
		case "award", "community", "leadership", "other":
			evidenceType = "claimed_project"
		}
		platform := "portfolio"
		if strings.Contains(strings.ToLower(highlight.URL), "linkedin.com") {
			platform = "linkedin"
		}
		items = append(items, models.EvidenceItem{
			Type:       evidenceType,
			Title:      title,
			Platform:   platform,
			Verified:   false,
			Count:      1,
			URL:        strings.TrimSpace(highlight.URL),
			OccurredAt: now,
		})
		if len(items) >= 6 {
			break
		}
	}
	return items
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
