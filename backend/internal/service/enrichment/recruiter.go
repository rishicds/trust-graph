package enrichment

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
)

type RecruiterResult struct {
	Report          models.RecruiterReport
	EnrichedSources []models.EnrichedSource
	Evidence        []models.EvidenceItem
	Insight         models.ProfileInsight
}

type RecruiterProgressFn func(percent int, step string, finding *models.RecruiterFinding) error

func (a *Agent) RecruiterDeepSearch(ctx context.Context, profile *models.Profile, scoreBefore float64, onProgress RecruiterProgressFn) (*RecruiterResult, error) {
	if profile == nil {
		return nil, fmt.Errorf("profile required")
	}
	if !a.aiEnabled() {
		return nil, fmt.Errorf("NVIDIA_AI_API or GEMINI_API_KEY required for recruiter insights")
	}
	if !a.tavily.Enabled() {
		return nil, fmt.Errorf("TAVILY_API_KEY required for recruiter web search")
	}

	now := time.Now().UTC()
	sources := make([]models.EnrichedSource, 0)
	var corpus strings.Builder
	seenURLs := map[string]bool{}
	reportedFindings := map[string]bool{}
	reportFinding := func(hit SearchHit) {
		if hit.URL == "" || onProgress == nil || reportedFindings[hit.URL] {
			return
		}
		if !shouldIncludeWebSource(profile, hit.URL) {
			return
		}
		reportedFindings[hit.URL] = true
		_ = onProgress(0, "", &models.RecruiterFinding{
			Title:    hit.Title,
			URL:      hit.URL,
			Snippet:  truncate(hit.Content, 280),
			Platform: inferPlatform(hit.URL),
		})
	}

	emit := func(percent int, step string) {
		if onProgress != nil {
			_ = onProgress(percent, step, nil)
		}
	}

	emit(5, "Preparing profile context")
	publicEmail := a.resolvePublicEmail(ctx, profile)
	corpus.WriteString(buildProfileCorpus(profile))
	writeIdentityCorpus(&corpus, profile, publicEmail)

	queries := recruiterQueries(profile, publicEmail)
	var searchHits []SearchHit
	for i, q := range queries {
		emit(10+i*5, fmt.Sprintf("Searching the web (%d/%d)", i+1, len(queries)))
		hits, err := a.tavily.SearchAdvanced(ctx, q, 6)
		if err != nil {
			continue
		}
		hits = filterSearchHits(profile, hits)
		for _, hit := range hits {
			reportFinding(hit)
		}
		searchHits = append(searchHits, hits...)
	}

	corpus.WriteString("\n--- Deep web search (Tavily advanced) ---\n")
	for _, hit := range searchHits {
		if hit.URL == "" || seenURLs[hit.URL] {
			continue
		}
		if !shouldIncludeWebSource(profile, hit.URL) {
			continue
		}
		seenURLs[hit.URL] = true
		corpus.WriteString(fmt.Sprintf("- %s (%s): %s\n", hit.Title, hit.URL, hit.Content))
		sources = append(sources, models.EnrichedSource{
			Platform:  "web",
			URL:       hit.URL,
			Title:     hit.Title,
			Snippet:   hit.Content,
			ScrapedAt: now,
		})
	}

	profileLinks := collectURLs(profile)
	for i, link := range profileLinks {
		if !a.firecrawl.Enabled() {
			break
		}
		emit(38+i*4, fmt.Sprintf("Scraping %s profile", link.Platform))
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
			Snippet:   truncate(scraped.Markdown, 1200),
			ScrapedAt: now,
		})
		reportFinding(SearchHit{Title: scraped.Title, URL: link.URL, Content: truncate(scraped.Markdown, 280)})
		corpus.WriteString(fmt.Sprintf("\n--- Scraped %s (%s) ---\n%s\n", link.Platform, link.URL, truncate(scraped.Markdown, 8000)))
	}

	scrapeBudget := 5
	scrapedCount := 0
	for _, hit := range searchHits {
		if scrapeBudget <= 0 || !a.firecrawl.Enabled() {
			break
		}
		if hit.URL == "" || seenURLs["scrape:"+hit.URL] {
			continue
		}
		if !shouldIncludeWebSource(profile, hit.URL) || !shouldScrapeRecruiterURL(hit.URL) {
			continue
		}
		seenURLs["scrape:"+hit.URL] = true
		scrapeBudget--
		scrapedCount++
		emit(58+scrapedCount*3, fmt.Sprintf("Deep-reading result %d", scrapedCount))
		scraped, err := a.firecrawl.Scrape(ctx, hit.URL)
		if err != nil {
			continue
		}
		platform := inferPlatform(hit.URL)
		if platform == "github" && !shouldIncludeGitHubSource(profile, hit.URL) {
			continue
		}
		sources = append(sources, models.EnrichedSource{
			Platform:  platform,
			URL:       hit.URL,
			Title:     scraped.Title,
			Snippet:   truncate(scraped.Markdown, 1200),
			ScrapedAt: now,
		})
		reportFinding(SearchHit{Title: scraped.Title, URL: hit.URL, Content: truncate(scraped.Markdown, 280)})
		corpus.WriteString(fmt.Sprintf("\n--- Scraped search result %s ---\n%s\n", hit.URL, truncate(scraped.Markdown, 6000)))
	}

	emit(78, "AI analyzing hiring signals")
	systemPrompt := `You are TrustGraph's recruiter intelligence agent. Analyze ONLY the provided public evidence and web findings.
The verified identity section lists the canonical GitHub login for this person. Do NOT merge or mention other GitHub accounts or name collisions unless explicitly verified.
Return valid JSON with keys:
- summary (3-4 sentences for a hiring manager)
- highlights (4-6 notable facts backed by evidence)
- role_signals (skills/roles inferred)
- hiring_signals (positive signals for recruiting: impact, leadership, consistency)
- red_flags (gaps, inconsistencies, or unverifiable claims — empty array if none)
- cross_platform_consistency (high|medium|low)
- gaps (missing evidence a recruiter would want)
Do not invent employers, degrees, or metrics. Cite uncertainty when evidence is thin.`

	draft, model, err := a.generateRecruiterInsights(ctx, systemPrompt, corpus.String())
	if err != nil {
		return nil, err
	}

	emit(92, "Finalizing recruiter report")
	sourceURLs := make([]string, 0, len(sources))
	webFindings := make([]models.RecruiterFinding, 0, len(searchHits))
	for _, s := range sources {
		if s.URL != "" && s.Error == "" && shouldIncludeWebSource(profile, s.URL) {
			sourceURLs = append(sourceURLs, s.URL)
		}
	}
	for _, hit := range searchHits {
		if hit.URL == "" || !shouldIncludeWebSource(profile, hit.URL) {
			continue
		}
		webFindings = append(webFindings, models.RecruiterFinding{
			Title:    hit.Title,
			URL:      hit.URL,
			Snippet:  truncate(hit.Content, 280),
			Platform: inferPlatform(hit.URL),
		})
	}

	report := models.RecruiterReport{
		Summary:                  draft.Summary,
		Highlights:               draft.Highlights,
		RoleSignals:              draft.RoleSignals,
		HiringSignals:            draft.HiringSignals,
		RedFlags:                 draft.RedFlags,
		CrossPlatformConsistency: draft.CrossPlatformConsistency,
		Gaps:                     draft.Gaps,
		WebFindings:              webFindings,
		SourceURLs:               sourceURLs,
		Model:                    model,
		ScoreBefore:              scoreBefore,
		GeneratedAt:              now,
	}
	sanitizeRecruiterText(profile, &report)

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

	evidence := buildRecruiterEvidence(profile, sources, draft, now)

	return &RecruiterResult{
		Report:          report,
		EnrichedSources: sources,
		Evidence:        evidence,
		Insight:         insight,
	}, nil
}

func buildProfileCorpus(profile *models.Profile) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("Developer: %s (@%s)\nTrust score: %.1f\n", profile.DisplayName, profile.Handle, profile.TrustScore.Overall))
	if profile.Headline != "" {
		b.WriteString("Headline: " + profile.Headline + "\n")
	}
	b.WriteString("\n--- Evidence ---\n")
	for _, e := range profile.Evidence {
		b.WriteString(fmt.Sprintf("- [%s] %s count=%d verified=%v\n", e.Platform, e.Title, e.Count, e.Verified))
		if e.Description != "" {
			b.WriteString("  " + truncate(e.Description, 200) + "\n")
		}
	}
	if profile.AIInsight != nil {
		b.WriteString("\n--- Existing AI insight ---\n")
		b.WriteString(profile.AIInsight.Summary + "\n")
	}
	return b.String()
}

func shouldScrapeRecruiterURL(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := strings.ToLower(u.Hostname())
	block := []string{"google.", "bing.", "yahoo.", "facebook.", "instagram.", "tiktok."}
	for _, b := range block {
		if strings.Contains(host, b) {
			return false
		}
	}
	return true
}

func inferPlatform(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return "web"
	}
	host := strings.ToLower(u.Hostname())
	switch {
	case strings.Contains(host, "linkedin"):
		return "linkedin"
	case strings.Contains(host, "github"):
		return "github"
	case strings.Contains(host, "stackoverflow"):
		return "stackoverflow"
	case strings.Contains(host, "devpost"):
		return "devpost"
	case strings.Contains(host, "youtube") || strings.Contains(host, "youtu.be"):
		return "talks"
	default:
		return "web"
	}
}

func buildRecruiterEvidence(profile *models.Profile, sources []models.EnrichedSource, draft *RecruiterDraft, now time.Time) []models.EvidenceItem {
	items := buildEnrichmentEvidence(profile, sources, &draft.InsightDraft, now)

	webCount := 0
	for _, s := range sources {
		if s.Platform == "web" && s.Error == "" {
			webCount++
		}
	}
	if webCount > 0 {
		items = append(items, models.EvidenceItem{
			Type:        "web_corroboration",
			Title:       "Recruiter web corroboration",
			Platform:    "trustgraph",
			Verified:    false,
			Count:       webCount,
			Description: fmt.Sprintf("%d public web sources cross-referenced", webCount),
			OccurredAt:  now,
		})
	}

	if len(draft.HiringSignals) > 0 {
		items = append(items, models.EvidenceItem{
			Type:        "recruiter_insight",
			Title:       "Recruiter hiring signals",
			Platform:    "trustgraph",
			Verified:    false,
			Description: strings.Join(draft.HiringSignals, "; "),
			OccurredAt:  now,
		})
	}

	return items
}
