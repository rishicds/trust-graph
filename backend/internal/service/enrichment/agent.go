package enrichment

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

type Agent struct {
	firecrawl *FirecrawlClient
	tavily    *TavilyClient
	nvidia    *NVIDIAClient
	gemini    *GeminiClient
	github    *githubsvc.Client
}

func NewAgent(firecrawl *FirecrawlClient, tavily *TavilyClient, nvidia *NVIDIAClient, gemini *GeminiClient, github *githubsvc.Client) *Agent {
	return &Agent{firecrawl: firecrawl, tavily: tavily, nvidia: nvidia, gemini: gemini, github: github}
}

func (a *Agent) Capabilities() map[string]bool {
	return map[string]bool{
		"firecrawl": a.firecrawl != nil && a.firecrawl.Enabled(),
		"tavily":    a.tavily != nil && a.tavily.Enabled(),
		"nvidia_ai": a.nvidia != nil && a.nvidia.Enabled(),
		"gemini":    a.gemini != nil && a.gemini.Enabled(),
	}
}

func (a *Agent) Firecrawl() *FirecrawlClient { return a.firecrawl }
func (a *Agent) Tavily() *TavilyClient       { return a.tavily }
func (a *Agent) Gemini() *GeminiClient       { return a.gemini }

func (a *Agent) GenerateJSON(ctx context.Context, systemPrompt, userPrompt string, maxTokens int) ([]byte, error) {
	if a.gemini.Enabled() {
		raw, err := a.gemini.GenerateStructuredJSON(ctx, systemPrompt, userPrompt, maxTokens)
		if err == nil {
			return raw, nil
		}
		fmt.Printf("enrichment: gemini failed, trying nvidia fallback: %v\n", err)
	}

	if a.nvidia.Enabled() {
		return a.nvidia.GenerateStructuredJSON(ctx, systemPrompt, userPrompt, maxTokens)
	}

	return nil, fmt.Errorf("no AI provider available for JSON generation")
}


type Result struct {
	Insight         models.ProfileInsight
	EnrichedSources []models.EnrichedSource
	Evidence        []models.EvidenceItem
}

func (a *Agent) EnrichProfile(ctx context.Context, profile *models.Profile) (*Result, error) {
	if profile == nil {
		return nil, fmt.Errorf("profile required")
	}
	if !a.aiEnabled() {
		return nil, fmt.Errorf("NVIDIA_AI_API or GEMINI_API_KEY required for insight generation")
	}

	urls := collectURLs(profile)

	now := time.Now().UTC()
	sources := make([]models.EnrichedSource, 0, len(urls))
	var corpus strings.Builder

	publicEmail := a.resolvePublicEmail(ctx, profile)
	corpus.WriteString(fmt.Sprintf("Developer: %s (@%s)\n", profile.DisplayName, profile.Handle))
	writeIdentityCorpus(&corpus, profile, publicEmail)
	if profile.Headline != "" {
		corpus.WriteString("GitHub bio: " + profile.Headline + "\n")
	}
	corpus.WriteString("\n--- GitHub evidence ---\n")
	for _, e := range profile.Evidence {
		if e.Platform == "github" {
			corpus.WriteString(fmt.Sprintf("- %s (count=%d verified=%v)\n", e.Title, e.Count, e.Verified))
		}
	}

	for _, link := range urls {
		if !a.firecrawl.Enabled() {
			break
		}
		scraped, err := a.firecrawl.Scrape(ctx, link.URL)
		if err != nil {
			sources = append(sources, models.EnrichedSource{
				Platform:  link.Platform,
				URL:       link.URL,
				ScrapedAt: now,
				Error:     err.Error(),
			})
			continue
		}
		sources = append(sources, models.EnrichedSource{
			Platform:  link.Platform,
			URL:       link.URL,
			Title:     scraped.Title,
			Snippet:   truncate(scraped.Markdown, 800),
			ScrapedAt: now,
		})
		corpus.WriteString(fmt.Sprintf("\n--- Scraped %s (%s) ---\n%s\n", link.Platform, link.URL, truncate(scraped.Markdown, 6000)))
	}

	if a.tavily.Enabled() {
		query := enrichmentSearchQuery(profile, publicEmail)
		hits, err := a.tavily.Search(ctx, query, 4)
		if err == nil {
			hits = filterSearchHits(profile, hits)
			corpus.WriteString("\n--- Web search (Tavily) ---\n")
			for _, hit := range hits {
				corpus.WriteString(fmt.Sprintf("- %s (%s): %s\n", hit.Title, hit.URL, hit.Content))
				sources = append(sources, models.EnrichedSource{
					Platform:  "web",
					URL:       hit.URL,
					Title:     hit.Title,
					Snippet:   hit.Content,
					ScrapedAt: now,
				})
			}
		}
	}

	systemPrompt := `You are TrustGraph's evidence analyst. Summarize ONLY from the provided public data.
The canonical GitHub login in the verified identity section is the ONLY GitHub account for this person.
Never mention or merge other GitHub usernames, alternate accounts, or homonyms unless explicitly verified as the same person.
Return valid JSON with keys: summary (2-3 sentences), highlights (3-5 bullet strings), role_signals (skills/roles inferred from evidence),
cross_platform_consistency (high|medium|low), gaps (what evidence is missing).
Do not invent employers, degrees, or metrics not present in the input. Be precise and professional.`

	draft, model, err := a.generateInsights(ctx, systemPrompt, corpus.String())
	if err != nil {
		return nil, err
	}

	sourceURLs := make([]string, 0, len(sources))
	for _, s := range sources {
		if s.URL != "" && s.Error == "" && shouldIncludeWebSource(profile, s.URL) {
			sourceURLs = append(sourceURLs, s.URL)
		}
	}

	insight := models.ProfileInsight{
		Summary:                  draft.Summary,
		Highlights:               draft.Highlights,
		RoleSignals:              draft.RoleSignals,
		CrossPlatformConsistency: draft.CrossPlatformConsistency,
		Gaps:                     draft.Gaps,
		SourceURLs:               sourceURLs,
		Model:                    model,
		GeneratedAt:              now,
	}
	sanitizeInsightText(profile, &insight)

	evidence := buildEnrichmentEvidence(profile, sources, draft, now)

	if supplemental, err := a.SupplementSparseEvidence(ctx, profile); err == nil {
		evidence = appendUniqueEvidence(evidence, supplemental)
	}

	return &Result{
		Insight:         insight,
		EnrichedSources: sources,
		Evidence:        evidence,
	}, nil
}

type linkEntry struct {
	Platform string
	URL      string
}

func collectURLs(profile *models.Profile) []linkEntry {
	seen := map[string]bool{}
	var out []linkEntry

	add := func(platform, url string) {
		url = strings.TrimSpace(url)
		if url == "" || seen[url] {
			return
		}
		seen[url] = true
		out = append(out, linkEntry{Platform: platform, URL: url})
	}

	for _, link := range profile.SocialLinks {
		add(link.Platform, link.URL)
	}

	// Skip raw GitHub profile for scrape — we already have API data; focus on external links
	filtered := out[:0]
	for _, l := range out {
		if l.Platform == "github" {
			continue
		}
		filtered = append(filtered, l)
	}
	return filtered
}

func buildEnrichmentEvidence(profile *models.Profile, sources []models.EnrichedSource, draft *InsightDraft, now time.Time) []models.EvidenceItem {
	var items []models.EvidenceItem

	for _, s := range sources {
		if s.Error != "" || s.Platform == "web" {
			continue
		}
		if s.Platform == "github" && !shouldIncludeGitHubSource(profile, s.URL) {
			continue
		}
		title := fmt.Sprintf("%s profile corroborated", stringsTitle(s.Platform))
		if s.Title != "" {
			title = fmt.Sprintf("%s: %s", stringsTitle(s.Platform), s.Title)
		}
		items = append(items, models.EvidenceItem{
			Type:       "social_identity",
			Title:      title,
			Platform:   s.Platform,
			Verified:   true,
			Count:      1,
			URL:        s.URL,
			Description: truncate(s.Snippet, 240),
			OccurredAt: now,
		})
	}

	if len(draft.RoleSignals) > 0 {
		items = append(items, models.EvidenceItem{
			Type:       "ai_insight",
			Title:      "AI cross-platform role signals",
			Platform:   "trustgraph",
			Verified:   false,
			Description: strings.Join(draft.RoleSignals, ", "),
			OccurredAt: now,
		})
	}

	return items
}

func (a *Agent) resolvePublicEmail(ctx context.Context, profile *models.Profile) string {
	if a.github == nil || profile == nil {
		return ""
	}
	login := canonicalGitHubUsername(profile)
	if login == "" {
		return ""
	}
	email, err := a.github.FetchPublicEmail(ctx, login)
	if err != nil {
		return ""
	}
	return email
}

func enrichmentSearchQuery(profile *models.Profile, publicEmail string) string {
	name := strings.TrimSpace(profile.DisplayName)
	ghLogin := canonicalGitHubUsername(profile)
	parts := []string{}
	if ghLogin != "" {
		parts = append(parts, fmt.Sprintf(`"github.com/%s"`, ghLogin))
	}
	if name != "" && ghLogin != "" {
		parts = append(parts, fmt.Sprintf(`"%s"`, name))
	}
	if publicEmail != "" {
		parts = append(parts, fmt.Sprintf(`"%s"`, publicEmail))
	}
	if len(parts) == 0 {
		return fmt.Sprintf("%s %s developer", name, profile.Handle)
	}
	return strings.Join(parts, " ")
}

func stringsTitle(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

func appendUniqueEvidence(base, extra []models.EvidenceItem) []models.EvidenceItem {
	if len(extra) == 0 {
		return base
	}
	seen := map[string]bool{}
	for _, item := range base {
		seen[evidenceKey(item)] = true
	}
	for _, item := range extra {
		key := evidenceKey(item)
		if seen[key] {
			continue
		}
		seen[key] = true
		base = append(base, item)
	}
	return base
}

func evidenceKey(item models.EvidenceItem) string {
	return strings.ToLower(item.Type + "|" + item.Platform + "|" + item.Title)
}
