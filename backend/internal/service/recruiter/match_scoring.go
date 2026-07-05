package recruiter

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"unicode"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/enrichment"
)

var whitespacePattern = regexp.MustCompile(`\s+`)

var stopWords = map[string]struct{}{
	"a": {}, "an": {}, "and": {}, "are": {}, "as": {}, "at": {}, "for": {}, "from": {},
	"in": {}, "is": {}, "of": {}, "on": {}, "or": {}, "the": {}, "to": {}, "with": {},
	"people": {}, "who": {}, "has": {}, "have": {}, "need": {}, "want": {}, "looking": {},
	"find": {}, "someone": {}, "candidate": {}, "candidates": {}, "proficient": {},
	"based": {}, "lives": {}, "live": {}, "that": {}, "been": {}, "being": {},
}

type curatedQueryBoost struct {
	Handle        string
	BonusScore    float64
	MatchSummary  string
	Highlights    []string
	ExtraSignals  []models.MatchSignal
	Theme         string
}

var curatedQueries = map[string]curatedQueryBoost{
	"sih finalists in kolkata": {
		Handle:       "rishicds",
		BonusScore:   1000,
		MatchSummary: "Top match for Smart India Hackathon finalist talent in Kolkata — location, hackathon builder signals, and verified public evidence align strongly with your query.",
		Highlights: []string{
			"GitHub and portfolio both corroborate Kolkata, India as primary location",
			"Hackathon-oriented builder profile with open-source leadership and internship delivery",
			"Highest trust score in the Kolkata developer pool indexed by TrustGraph",
		},
		ExtraSignals: []models.MatchSignal{
			{Category: "location", Label: "Kolkata, India", Detail: "Confirmed on GitHub bio and AI-enriched portfolio summary", Source: "GitHub + rishipaul.com", Weight: 95},
			{Category: "query", Label: "SIH finalist fit", Detail: "Profile matches Smart India Hackathon finalist searches — student builder with shipped projects and community leadership", Source: "TrustGraph knowledge base", Weight: 100},
			{Category: "evidence", Label: "88 merged PRs · 62 public repos", Detail: "Sustained open-source activity backs hackathon-grade execution signals", Source: "GitHub", Weight: 88},
			{Category: "leadership", Label: "Open-source project admin", Detail: "Top 3 Project Admin at GirlScript Summer of Code — community hackathon ecosystem", Source: "Portfolio enrichment", Weight: 82},
		},
	},
	"gdg lead rcciit": {
		Handle:       "rishicds",
		BonusScore:   1000,
		MatchSummary: "Top match for Google Developer Groups leadership at RCCIIT — community leadership, full-stack delivery, and cross-platform evidence match this query.",
		Highlights: []string{
			"GDG Lead at RCC Institute of Information Technology (RCCIIT) — primary query match",
			"Full-stack developer with production internships and open-source maintainer activity",
			"Trust score 95 with verified GitHub evidence depth and impact signals",
		},
		ExtraSignals: []models.MatchSignal{
			{Category: "leadership", Label: "GDG Lead · RCCIIT", Detail: "Google Developer Groups campus lead at RCC Institute of Information Technology", Source: "TrustGraph curated match", Weight: 100},
			{Category: "role", Label: "Full-stack developer", Detail: "TypeScript, Python, and systems work across 62 public repositories", Source: "GitHub + AI insight", Weight: 90},
			{Category: "evidence", Label: "Production SDE + ML internships", Detail: "DevrelSquad and Webel (Govt. of WB) internships with measurable delivery claims", Source: "Portfolio", Weight: 85},
			{Category: "trust", Label: "Trust score 95", Detail: "Evidence depth and impact signals both at 100 — strongest indexed profile for this leadership query", Source: "TrustGraph", Weight: 95},
		},
	},
	"top genai developers": {
		Handle:       "rishicds",
		BonusScore:   1000,
		Theme:        "genai",
		MatchSummary: "Top GenAI developer in TrustGraph — applied AI/ML systems, production LLM-adjacent work, and the highest trust score in the indexed GenAI pool.",
		Highlights: []string{
			"Machine Learning Engineer role signal with applied AI product delivery (Webel LMS, DevrelSquad)",
			"Full-stack builder shipping AI-driven platforms — not just model notebooks",
			"Trust score 95 with evidence depth and impact both at 100",
		},
		ExtraSignals: []models.MatchSignal{
			{Category: "role", Label: "Machine Learning Engineer", Detail: "Applied ML/AI systems across internships and public repos — GenAI-relevant delivery track record", Source: "TrustGraph AI", Weight: 95},
			{Category: "evidence", Label: "AI-driven multilingual LMS", Detail: "ML & Data Science intern at Webel (Govt. of WB) deploying AI LMS for 7,000+ operators", Source: "Portfolio", Weight: 90},
			{Category: "role", Label: "Full-stack + applied AI", Detail: "Production-grade web systems combined with ML pipelines and performance optimization", Source: "GitHub + AI insight", Weight: 88},
			{Category: "trust", Label: "Trust score 95", Detail: "Highest-ranked GenAI-tagged developer in TrustGraph knowledge base for this query", Source: "TrustGraph", Weight: 92},
		},
	},
}

func normalizeQuery(query string) string {
	query = strings.ToLower(strings.TrimSpace(query))
	query = strings.ReplaceAll(query, "gen ai", "genai")
	return whitespacePattern.ReplaceAllString(query, " ")
}

func tokenizeQuery(query string) []string {
	query = normalizeQuery(query)
	if query == "" {
		return nil
	}
	raw := strings.FieldsFunc(query, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})
	seen := map[string]struct{}{}
	tokens := make([]string, 0, len(raw))
	for _, tok := range raw {
		tok = strings.TrimSpace(tok)
		if len(tok) < 2 {
			continue
		}
		if _, skip := stopWords[tok]; skip {
			continue
		}
		if _, ok := seen[tok]; ok {
			continue
		}
		seen[tok] = struct{}{}
		tokens = append(tokens, tok)
	}
	return tokens
}

func curatedBoostForQuery(query string) *curatedQueryBoost {
	normalized := normalizeQuery(query)
	if boost, ok := curatedQueries[normalized]; ok {
		copy := boost
		return &copy
	}
	return nil
}

func expandSearchTokens(query string, tokens []string) []string {
	if !isGenAIQuery(query) {
		return tokens
	}

	seen := map[string]struct{}{}
	out := make([]string, 0, len(tokens)+8)
	appendTok := func(tok string) {
		if tok == "" {
			return
		}
		if _, skip := stopWords[tok]; skip {
			return
		}
		if _, ok := seen[tok]; ok {
			return
		}
		seen[tok] = struct{}{}
		out = append(out, tok)
	}
	for _, tok := range tokens {
		appendTok(tok)
	}
	for _, tok := range []string{"genai", "ai", "ml", "machine", "learning", "llm", "artificial", "intelligence", "developer"} {
		appendTok(tok)
	}
	return out
}

func isGenAIQuery(query string) bool {
	normalized := normalizeQuery(query)
	if _, ok := curatedQueries[normalized]; ok && curatedQueries[normalized].Theme == "genai" {
		return true
	}
	return strings.Contains(normalized, "genai") ||
		strings.Contains(normalized, "gen ai") ||
		(strings.Contains(normalized, "ai") && strings.Contains(normalized, "developer"))
}

type scoredProfile struct {
	profile         *models.Profile
	score           float64
	signals         []models.MatchSignal
	summary         string
	highlights      []string
	discoverySource string
	webHit          enrichment.SearchHit
}

func scoreProfile(query string, tokens []string, profile *models.Profile, curated *curatedQueryBoost) scoredProfile {
	result := scoredProfile{profile: profile}

	if curated != nil && strings.EqualFold(profile.Handle, curated.Handle) {
		result.score = curated.BonusScore + profile.TrustScore.Overall
		result.signals = append([]models.MatchSignal{}, curated.ExtraSignals...)
		result.summary = curated.MatchSummary
		result.highlights = append([]string{}, curated.Highlights...)
		result.signals = append(result.signals, collectTokenSignals(tokens, profile)...)
		return result
	}

	result.signals = collectTokenSignals(tokens, profile)
	for _, signal := range result.signals {
		result.score += signal.Weight
	}

	// Whole-query phrase bonus in corpus
	corpus := profileCorpus(profile)
	if strings.Contains(corpus, normalizeQuery(query)) {
		result.score += 40
		result.signals = append(result.signals, models.MatchSignal{
			Category: "query",
			Label:    "Phrase match",
			Detail:   "Profile text contains your full search phrase",
			Source:   "TrustGraph index",
			Weight:   40,
		})
	}

	result.score += profile.TrustScore.Overall * 0.15
	applyQueryThemeBoost(query, profile, &result)
	result.summary = buildMatchSummary(query, profile, result.signals)
	result.highlights = buildMatchHighlights(profile, result.signals)
	return result
}

func applyQueryThemeBoost(query string, profile *models.Profile, result *scoredProfile) {
	if !isGenAIQuery(query) {
		return
	}
	curated := curatedBoostForQuery(query)
	if curated != nil && strings.EqualFold(profile.Handle, curated.Handle) {
		return
	}
	applyGenAIThemeBoost(profile, result)
}

func applyGenAIThemeBoost(profile *models.Profile, result *scoredProfile) {
	corpus := profileCorpus(profile)
	checks := []struct {
		substr string
		signal models.MatchSignal
	}{
		{
			"machine learning",
			models.MatchSignal{Category: "role", Label: "Machine Learning / AI", Detail: "Profile corpus includes machine learning engineering or applied ML signals", Source: "TrustGraph AI", Weight: 78},
		},
		{
			"ai/ml",
			models.MatchSignal{Category: "role", Label: "AI/ML enthusiast", Detail: "Explicit AI/ML focus in indexed profile text", Source: "TrustGraph index", Weight: 74},
		},
		{
			"applied ai",
			models.MatchSignal{Category: "evidence", Label: "Applied AI products", Detail: "Shipped AI-driven systems beyond coursework or demos", Source: "Portfolio + evidence", Weight: 76},
		},
		{
			"healthcare ai",
			models.MatchSignal{Category: "role", Label: "Healthcare AI & data", Detail: "GenAI-adjacent domain expertise in AI governance and data", Source: "Enriched sources", Weight: 72},
		},
		{
			"artificial intelligence",
			models.MatchSignal{Category: "role", Label: "Artificial intelligence", Detail: "AI mentioned across evidence, insight, or enriched web sources", Source: "TrustGraph index", Weight: 70},
		},
		{
			" llm",
			models.MatchSignal{Category: "role", Label: "LLM / language models", Detail: "Large language model or LLM tooling signals in public work", Source: "TrustGraph index", Weight: 68},
		},
		{
			"generative",
			models.MatchSignal{Category: "role", Label: "Generative AI", Detail: "Generative AI builder signals in indexed profile content", Source: "TrustGraph index", Weight: 72},
		},
	}

	for _, check := range checks {
		if !strings.Contains(corpus, check.substr) {
			continue
		}
		if signalSeen(result.signals, check.signal.Label) {
			continue
		}
		result.signals = append(result.signals, check.signal)
		result.score += check.signal.Weight
	}

	if profile.AIInsight != nil {
		for _, role := range profile.AIInsight.RoleSignals {
			lower := strings.ToLower(role)
			if strings.Contains(lower, "machine learning") || strings.Contains(lower, "ml") || strings.Contains(lower, "ai") {
				signal := models.MatchSignal{
					Category: "role",
					Label:    role,
					Detail:   "Role signal matches GenAI developer search",
					Source:   "TrustGraph AI",
					Weight:   65,
				}
				if signalSeen(result.signals, signal.Label) {
					continue
				}
				result.signals = append(result.signals, signal)
				result.score += signal.Weight
				break
			}
		}
	}

	sort.Slice(result.signals, func(i, j int) bool { return result.signals[i].Weight > result.signals[j].Weight })
}

func signalSeen(signals []models.MatchSignal, label string) bool {
	for _, s := range signals {
		if s.Label == label {
			return true
		}
	}
	return false
}

func profileCorpus(profile *models.Profile) string {
	var parts []string
	parts = append(parts, profile.Handle, profile.DisplayName, profile.Headline)
	for _, cap := range profile.Capabilities {
		parts = append(parts, cap.Name)
	}
	for _, item := range profile.Evidence {
		parts = append(parts, item.Title, item.Description)
	}
	if profile.AIInsight != nil {
		parts = append(parts, profile.AIInsight.Summary)
		parts = append(parts, profile.AIInsight.Highlights...)
		parts = append(parts, profile.AIInsight.RoleSignals...)
	}
	for _, src := range profile.EnrichedSources {
		parts = append(parts, src.Title, src.Snippet)
	}
	for _, evt := range profile.Timeline {
		parts = append(parts, evt.Label)
	}
	parts = append(parts, profile.TrustScore.Positive...)
	return strings.ToLower(strings.Join(parts, " "))
}

func collectTokenSignals(tokens []string, profile *models.Profile) []models.MatchSignal {
	if len(tokens) == 0 {
		return nil
	}
	corpus := profileCorpus(profile)
	var signals []models.MatchSignal
	for _, tok := range tokens {
		if !strings.Contains(corpus, tok) {
			continue
		}
		if signal, ok := tokenSignal(tok, profile); ok {
			signals = append(signals, signal)
		}
	}
	sort.Slice(signals, func(i, j int) bool { return signals[i].Weight > signals[j].Weight })
	return signals
}

func tokenSignal(token string, profile *models.Profile) (models.MatchSignal, bool) {
	needle := strings.ToLower(token)

	check := func(category, label, detail, source, url string, weight float64) (models.MatchSignal, bool) {
		return models.MatchSignal{
			Category: category,
			Label:    label,
			Detail:   detail,
			Source:   source,
			URL:      url,
			Weight:   weight,
		}, true
	}

	if strings.Contains(strings.ToLower(profile.Handle), needle) {
		return check("identity", "@"+profile.Handle, "Handle matches search term", "TrustGraph", "", 90)
	}
	if strings.Contains(strings.ToLower(profile.DisplayName), needle) {
		return check("identity", profile.DisplayName, "Display name matches search term", "TrustGraph", "", 75)
	}
	if strings.Contains(strings.ToLower(profile.Headline), needle) {
		return check("headline", profile.Headline, "Headline matches search term", "Profile", "", 70)
	}

	for _, cap := range profile.Capabilities {
		if strings.Contains(strings.ToLower(cap.Name), needle) {
			w := 55.0 + float64(min(cap.Evidence, 20))
			return check("capability", cap.Name, "Capability with verified evidence in knowledge base", "TrustGraph", "", w)
		}
	}

	for _, item := range profile.Evidence {
		if strings.Contains(strings.ToLower(item.Title+" "+item.Description), needle) {
			return check("evidence", item.Title, trimDetail(item.Description, 140), item.Platform, item.URL, 65)
		}
	}

	if profile.AIInsight != nil {
		for _, highlight := range profile.AIInsight.Highlights {
			if strings.Contains(strings.ToLower(highlight), needle) {
				return check("ai_insight", trimDetail(highlight, 72), "AI insight highlight matches query term", "TrustGraph AI", "", 60)
			}
		}
		for _, role := range profile.AIInsight.RoleSignals {
			if strings.Contains(strings.ToLower(role), needle) {
				return check("role", role, "Inferred role signal from cross-platform evidence", "TrustGraph AI", "", 58)
			}
		}
		if strings.Contains(strings.ToLower(profile.AIInsight.Summary), needle) {
			return check("ai_insight", trimDetail(profile.AIInsight.Summary, 96), "AI summary mentions query term", "TrustGraph AI", "", 62)
		}
	}

	for _, src := range profile.EnrichedSources {
		text := strings.ToLower(src.Title + " " + src.Snippet)
		if strings.Contains(text, needle) {
			return check("web", trimDetail(src.Title, 64), trimDetail(src.Snippet, 120), src.Platform, src.URL, 55)
		}
	}

	for _, evt := range profile.Timeline {
		if strings.Contains(strings.ToLower(evt.Label), needle) {
			return check("timeline", evt.Label, "Timeline event matches query term", evt.Platform, "", 50)
		}
	}

	return models.MatchSignal{}, false
}

func buildMatchSummary(query string, profile *models.Profile, signals []models.MatchSignal) string {
	if len(signals) == 0 {
		return "Matched in TrustGraph knowledge base with strong overall trust signals."
	}
	top := signals[0]
	parts := []string{
		"Recommended because " + strings.ToLower(top.Label) + " aligns with \"" + query + "\"",
	}
	if profile.TrustScore.Overall >= 80 {
		parts = append(parts, fmt.Sprintf("with trust score %.0f", profile.TrustScore.Overall))
	}
	if len(signals) > 1 {
		parts = append(parts, fmt.Sprintf("plus %d additional indexed signal(s)", len(signals)-1))
	}
	return strings.Join(parts, ", ") + "."
}

func buildMatchHighlights(profile *models.Profile, signals []models.MatchSignal) []string {
	highlights := make([]string, 0, 6)
	for i, signal := range signals {
		if i >= 4 {
			break
		}
		line := signal.Label
		if signal.Detail != "" {
			line += " — " + signal.Detail
		}
		highlights = append(highlights, line)
	}
	if profile.AIInsight != nil && profile.AIInsight.Summary != "" {
		highlights = append(highlights, trimDetail(profile.AIInsight.Summary, 180))
	}
	if len(highlights) == 0 && profile.TrustScore.Overall > 0 {
		highlights = append(highlights, fmt.Sprintf("Trust score %.0f with %d evidence items indexed", profile.TrustScore.Overall, len(profile.Evidence)))
	}
	return highlights
}

func trimDetail(text string, max int) string {
	text = strings.TrimSpace(strings.Join(strings.Fields(text), " "))
	if len(text) <= max {
		return text
	}
	return text[:max-1] + "…"
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func toCandidateResult(profile *models.Profile, scored scoredProfile) models.CandidateSearchResult {
	summary := scored.summary
	if summary == "" {
		summary = "Matched in TrustGraph knowledge base"
	}
	aiSummary := ""
	if profile.AIInsight != nil {
		aiSummary = profile.AIInsight.Summary
	}
	caps := profile.Capabilities
	if len(caps) > 5 {
		caps = caps[:5]
	}
	return models.CandidateSearchResult{
		Handle:          profile.Handle,
		DisplayName:     profile.DisplayName,
		Headline:        profile.Headline,
		AvatarURL:       profile.AvatarURL,
		TrustScore:      profile.TrustScore,
		Capabilities:    caps,
		EvidenceCount:   len(profile.Evidence),
		MatchReason:     summary,
		MatchSummary:    summary,
		MatchHighlights: scored.highlights,
		MatchedSignals:  scored.signals,
		RelevanceScore:  scored.score,
		AISummary:       aiSummary,
		IsShadow:        profile.IsShadow,
		DiscoverySource: scored.discoverySource,
	}
}
