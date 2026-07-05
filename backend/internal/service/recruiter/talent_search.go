package recruiter

import (
	"context"
	"fmt"
	"regexp"
	"sort"
	"strings"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/enrichment"
	"github.com/trustgraph/backend/internal/service/profilesync"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

type TalentSearch struct {
	store     *repository.Store
	tavily    *enrichment.TavilyClient
	firecrawl *enrichment.FirecrawlClient
	github    *githubsvc.Client
}

func NewTalentSearch(store *repository.Store, tavily *enrichment.TavilyClient, firecrawl *enrichment.FirecrawlClient, github *githubsvc.Client) *TalentSearch {
	return &TalentSearch{store: store, tavily: tavily, firecrawl: firecrawl, github: github}
}

type TalentSearchMeta struct {
	IndexedCount       int                       `json:"indexed_count"`
	WebDiscoveredCount int                       `json:"web_discovered_count"`
	TavilyUsed         bool                      `json:"tavily_used"`
	FirecrawlUsed      bool                      `json:"firecrawl_used"`
	WebResultsReviewed int                       `json:"web_results_reviewed"`
	ParsedQuery        models.ParsedRecruiterQuery `json:"parsed_query"`
	FilteredOut        int                       `json:"filtered_out,omitempty"`
}

type TalentSearchResponse struct {
	Results []models.CandidateSearchResult `json:"results"`
	Meta    TalentSearchMeta               `json:"meta"`
}

var githubUserPath = regexp.MustCompile(`github\.com/([a-zA-Z0-9-]+)(?:/|$|\?)`)

func (t *TalentSearch) Search(ctx context.Context, query, segment string, limit int, filters models.RecruiterSearchFilters, starredHandles map[string]struct{}) (TalentSearchResponse, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return TalentSearchResponse{}, fmt.Errorf("query required")
	}
	if limit <= 0 {
		limit = 8
	}

	parsed := MergeQueryAndFilters(ParseRecruiterQuery(query), filters)

	meta := TalentSearchMeta{
		TavilyUsed:  t.tavily != nil && t.tavily.Enabled(),
		ParsedQuery: parsed,
	}

	tokens := expandSearchTokens(query, tokenizeQuery(query))
	for _, employer := range parsed.Employers {
		for _, variant := range employerVariants(employer) {
			tokens = appendUniqueStrings(tokens, variant)
		}
	}
	curated := curatedBoostForQuery(query)
	candidates, err := t.loadCandidateProfiles(ctx, query, tokens, curated, meta.TavilyUsed)
	if err != nil {
		return TalentSearchResponse{}, err
	}

	scored := make([]scoredProfile, 0, len(candidates))
	for i := range candidates {
		p := &candidates[i]
		item := scoreProfile(query, tokens, p, curated)
		item.discoverySource = "indexed"
		scored = append(scored, item)
	}

	sort.Slice(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			return scored[i].profile.TrustScore.Overall > scored[j].profile.TrustScore.Overall
		}
		return scored[i].score > scored[j].score
	})

	if meta.TavilyUsed {
		var webReviewed int
		scored, webReviewed = t.mergeWebCandidates(ctx, query, segment, limit, scored, parsed)
		meta.WebResultsReviewed = webReviewed
		meta.FirecrawlUsed = t.firecrawl != nil && t.firecrawl.Enabled()
		sort.Slice(scored, func(i, j int) bool {
			if scored[i].score == scored[j].score {
				return scored[i].profile.TrustScore.Overall > scored[j].profile.TrustScore.Overall
			}
			return scored[i].score > scored[j].score
		})
	}

	beforeFilter := len(scored)
	scored = applySearchFilters(scored, parsed, filters, starredHandles)
	meta.FilteredOut = beforeFilter - len(scored)
	meta.IndexedCount = 0
	for _, item := range scored {
		if item.discoverySource != "web" {
			meta.IndexedCount++
		}
	}

	results := make([]models.CandidateSearchResult, 0, limit)
	webInResults := 0
	for i := range scored {
		if len(results) >= limit {
			break
		}
		result := toCandidateResult(scored[i].profile, scored[i])
		if _, ok := starredHandles[strings.ToLower(result.Handle)]; ok {
			result.Starred = true
		}
		if result.DiscoverySource == "web" {
			webInResults++
		}
		results = append(results, result)
	}
	meta.WebDiscoveredCount = webInResults

	return TalentSearchResponse{Results: results, Meta: meta}, nil
}

func (t *TalentSearch) loadCandidateProfiles(ctx context.Context, query string, tokens []string, curated *curatedQueryBoost, tavilyEnabled bool) ([]models.Profile, error) {
	seen := map[string]struct{}{}
	var profiles []models.Profile

	appendProfile := func(p *models.Profile) {
		if p == nil {
			return
		}
		handle := strings.ToLower(p.Handle)
		if _, ok := seen[handle]; ok {
			return
		}
		seen[handle] = struct{}{}
		profiles = append(profiles, *p)
	}

	if curated != nil {
		if p, err := t.store.FindProfileByHandle(ctx, curated.Handle); err == nil {
			appendProfile(p)
		}
	}

	if len(tokens) > 0 {
		tokenHits, err := t.store.SearchProfilesByTokens(ctx, tokens, 40)
		if err != nil {
			return nil, err
		}
		for i := range tokenHits {
			appendProfile(&tokenHits[i])
		}
	}

	textHits, err := t.store.SearchProfilesText(ctx, query, 20)
	if err != nil {
		return nil, err
	}
	for i := range textHits {
		appendProfile(&textHits[i])
	}

	if len(profiles) == 0 && !tavilyEnabled {
		fallback, err := t.store.ListProfiles(ctx, 30)
		if err != nil {
			return nil, err
		}
		for i := range fallback {
			appendProfile(&fallback[i])
		}
	}

	return profiles, nil
}

func (t *TalentSearch) mergeWebCandidates(ctx context.Context, query, segment string, limit int, scored []scoredProfile, parsed models.ParsedRecruiterQuery) ([]scoredProfile, int) {
	seen := map[string]struct{}{}
	for _, item := range scored {
		seen[strings.ToLower(item.profile.Handle)] = struct{}{}
	}

	searchQuery := query
	if len(parsed.Employers) > 0 {
		searchQuery = strings.Join(parsed.Employers, " ") + " engineer github profile " + query
	} else if segment == "developer" || segment == "" {
		searchQuery = query + " software engineer github profile"
	}
	hits, err := t.tavily.SearchAdvanced(ctx, searchQuery, limit*3)
	if err != nil {
		return scored, 0
	}

	type loginHit struct {
		login string
		hit   enrichment.SearchHit
	}
	var discoveries []loginHit
	appendLogin := func(login string, hit enrichment.SearchHit) {
		login = strings.ToLower(strings.TrimSpace(login))
		if login == "" || isReservedGitHubPath(login) {
			return
		}
		if _, ok := seen[login]; ok {
			return
		}
		seen[login] = struct{}{}
		discoveries = append(discoveries, loginHit{login: login, hit: hit})
	}

	for _, hit := range hits {
		for _, login := range githubLoginsFromText(hit.URL + " " + hit.Content) {
			appendLogin(login, hit)
		}
	}

	scrapeBudget := 2
	for _, hit := range hits {
		if scrapeBudget <= 0 || t.firecrawl == nil || !t.firecrawl.Enabled() {
			break
		}
		if strings.Contains(strings.ToLower(hit.URL), "github.com/") {
			continue
		}
		scrapeBudget--
		scraped, err := t.firecrawl.Scrape(ctx, hit.URL)
		if err != nil {
			continue
		}
		for _, login := range githubLoginsFromText(scraped.Markdown + " " + scraped.URL) {
			appendLogin(login, enrichment.SearchHit{
				Title:   scraped.Title,
				URL:     hit.URL,
				Content: truncateForSearch(scraped.Markdown, 500),
			})
		}
	}

	tokens := tokenizeQuery(query)
	curated := curatedBoostForQuery(query)
	for _, discovery := range discoveries {
		if len(scored) >= limit*2 {
			break
		}
		profile, err := t.ensureGitHubShadow(ctx, discovery.login)
		if err != nil || profile == nil {
			continue
		}
		item := scoreProfile(query, tokens, profile, curated)
		item.discoverySource = "web"
		item.webHit = discovery.hit
		item.score += 25
		ok, reqSignals := profileMatchesRequirements(profileCorpus(profile), parsed)
		if !ok {
			continue
		}
		if len(reqSignals) > 0 {
			item.signals = append(reqSignals, item.signals...)
			for _, sig := range reqSignals {
				item.score += sig.Weight
			}
		}
		item.signals = append([]models.MatchSignal{{
			Category: "web",
			Label:    "Discovered on the public web",
			Detail:   webDiscoveryDetail(discovery.hit),
			Source:   "Tavily",
			URL:      discovery.hit.URL,
			Weight:   25,
		}}, item.signals...)
		if item.summary == "" || strings.Contains(strings.ToLower(item.summary), "knowledge base") {
			item.summary = "Discovered via live web search and matched against your query using public GitHub evidence."
		}
		scored = append(scored, item)
	}

	return scored, len(hits)
}

func isReservedGitHubPath(login string) bool {
	switch login {
	case "orgs", "topics", "features", "sponsors", "settings", "marketplace", "login", "signup":
		return true
	default:
		return false
	}
}

func githubLoginsFromText(text string) []string {
	matches := githubUserPath.FindAllStringSubmatch(text, -1)
	out := make([]string, 0, len(matches))
	seen := map[string]struct{}{}
	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		login := strings.ToLower(m[1])
		if _, ok := seen[login]; ok {
			continue
		}
		seen[login] = struct{}{}
		out = append(out, login)
	}
	return out
}

func webDiscoveryDetail(hit enrichment.SearchHit) string {
	title := strings.TrimSpace(hit.Title)
	if title != "" {
		return fmt.Sprintf("Tavily surfaced %q — GitHub profile indexed from public web evidence", title)
	}
	return "Tavily web search linked this GitHub profile to your query"
}

func truncateForSearch(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}

func (t *TalentSearch) ensureGitHubShadow(ctx context.Context, login string) (*models.Profile, error) {
	existing, err := t.store.FindProfileByHandle(ctx, login)
	if err == nil {
		return existing, nil
	}
	if err != repository.ErrNotFound {
		return nil, err
	}
	if t.github == nil {
		return nil, fmt.Errorf("github unavailable")
	}
	stats, err := t.github.FetchStats(ctx, login)
	if err != nil {
		return nil, err
	}
	profile := profilesync.BuildShadowProfile(login, stats)
	if err := t.store.UpsertProfileByHandle(ctx, profile); err != nil {
		return nil, err
	}
	return profile, nil
}
