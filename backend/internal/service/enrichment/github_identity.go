package enrichment

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"

	"github.com/trustgraph/backend/internal/models"
)

var githubProfileMention = regexp.MustCompile(`(?i)github\.com/([a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?)`)
var multiGitHubAccounts = regexp.MustCompile(`(?i)[^.!?]*\b(?:two|multiple|second|other|alternate|another)\s+github\s+accounts?[^.!?]*[.!?]?`)
var githubAccountParen = regexp.MustCompile(`(?i)\([^)]*github[^)]*\)`)

func canonicalGitHubUsername(profile *models.Profile) string {
	if profile == nil {
		return ""
	}
	for _, ds := range profile.DataSources {
		if ds.Platform == "github" && ds.Connected && strings.TrimSpace(ds.ExternalID) != "" {
			return strings.ToLower(strings.TrimSpace(ds.ExternalID))
		}
	}
	for _, link := range profile.SocialLinks {
		if link.Platform != "github" {
			continue
		}
		if username := githubUsernameFromURL(link.URL); username != "" {
			return username
		}
	}
	for _, ds := range profile.DataSources {
		if ds.Platform == "github" && strings.TrimSpace(ds.ExternalID) != "" {
			return strings.ToLower(strings.TrimSpace(ds.ExternalID))
		}
	}
	return strings.ToLower(strings.TrimSpace(profile.Handle))
}

func githubUsernameFromURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return ""
	}
	if !isGitHubHost(u.Hostname()) {
		return ""
	}
	parts := strings.Split(strings.Trim(u.Path, "/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		return ""
	}
	switch parts[0] {
	case "orgs", "repos", "settings", "marketplace", "sponsors", "topics", "collections", "features":
		return ""
	}
	if len(parts) == 1 {
		return strings.ToLower(parts[0])
	}
	switch parts[1] {
	case "followers", "following", "repos", "projects", "packages", "stars", "gists":
		return strings.ToLower(parts[0])
	default:
		return strings.ToLower(parts[0])
	}
}

func isGitHubHost(host string) bool {
	host = strings.ToLower(host)
	return host == "github.com" || strings.HasSuffix(host, ".github.com")
}

func shouldIncludeGitHubSource(profile *models.Profile, sourceURL string) bool {
	return shouldIncludeWebSource(profile, sourceURL)
}

func shouldIncludeWebSource(profile *models.Profile, sourceURL string) bool {
	u, err := url.Parse(strings.TrimSpace(sourceURL))
	if err != nil {
		return false
	}
	if !isGitHubHost(u.Hostname()) {
		return true
	}
	canonical := canonicalGitHubUsername(profile)
	if canonical == "" {
		return false
	}
	owner := githubUsernameFromURL(sourceURL)
	return owner != "" && owner == canonical
}

func filterSearchHits(profile *models.Profile, hits []SearchHit) []SearchHit {
	if len(hits) == 0 {
		return hits
	}
	out := make([]SearchHit, 0, len(hits))
	for _, hit := range hits {
		if hit.URL == "" || shouldIncludeWebSource(profile, hit.URL) {
			out = append(out, hit)
		}
	}
	return out
}

func filterSourceURLs(profile *models.Profile, urls []string) []string {
	out := make([]string, 0, len(urls))
	for _, raw := range urls {
		if raw != "" && shouldIncludeWebSource(profile, raw) {
			out = append(out, raw)
		}
	}
	return out
}

func writeIdentityCorpus(b *strings.Builder, profile *models.Profile, publicEmail string) {
	canonical := canonicalGitHubUsername(profile)
	b.WriteString("\n--- Verified identity (do not substitute other people) ---\n")
	if canonical != "" {
		b.WriteString("Canonical GitHub login: " + canonical + "\n")
		b.WriteString("ONLY attribute GitHub activity to github.com/" + canonical + ". Ignore other GitHub accounts unless explicitly the same person with proof.\n")
	}
	if publicEmail != "" {
		b.WriteString("Public GitHub email: " + publicEmail + "\n")
	}
	if profile.DisplayName != "" {
		b.WriteString("Display name: " + profile.DisplayName + "\n")
	}
	b.WriteString("TrustGraph handle: @" + profile.Handle + "\n")
}

func recruiterQueries(profile *models.Profile, publicEmail string) []string {
	name := strings.TrimSpace(profile.DisplayName)
	ghLogin := canonicalGitHubUsername(profile)
	handle := strings.TrimSpace(profile.Handle)

	var queries []string
	if ghLogin != "" {
		queries = append(queries,
			fmt.Sprintf(`site:github.com/%s`, ghLogin),
			fmt.Sprintf(`"github.com/%s"`, ghLogin),
		)
		if name != "" {
			queries = append(queries, fmt.Sprintf(`"%s" "github.com/%s"`, name, ghLogin))
		}
	}
	if publicEmail != "" {
		queries = append(queries, fmt.Sprintf(`"%s" developer`, publicEmail))
	}
	if name != "" && ghLogin != "" {
		queries = append(queries,
			fmt.Sprintf(`"%s" %s linkedin`, name, ghLogin),
			fmt.Sprintf(`"%s" %s devpost OR "stack overflow"`, name, ghLogin),
		)
	} else if name != "" {
		queries = append(queries, fmt.Sprintf(`"%s" %s linkedin software engineer`, name, handle))
	}

	seen := map[string]bool{}
	unique := make([]string, 0, len(queries))
	for _, q := range queries {
		q = strings.TrimSpace(q)
		if q == "" || seen[q] {
			continue
		}
		seen[q] = true
		unique = append(unique, q)
	}
	return unique
}

func sanitizeInsightText(profile *models.Profile, insight *models.ProfileInsight) {
	if insight == nil {
		return
	}
	canonical := canonicalGitHubUsername(profile)
	insight.Summary = sanitizeGitHubMentions(insight.Summary, canonical)
	insight.Highlights = sanitizeGitHubMentionList(insight.Highlights, canonical)
	insight.RoleSignals = sanitizeGitHubMentionList(insight.RoleSignals, canonical)
	insight.Gaps = sanitizeGitHubMentionList(insight.Gaps, canonical)
	insight.SourceURLs = filterSourceURLs(profile, insight.SourceURLs)
}

func sanitizeRecruiterText(profile *models.Profile, report *models.RecruiterReport) {
	if report == nil {
		return
	}
	canonical := canonicalGitHubUsername(profile)
	report.Summary = sanitizeGitHubMentions(report.Summary, canonical)
	report.Highlights = sanitizeGitHubMentionList(report.Highlights, canonical)
	report.RoleSignals = sanitizeGitHubMentionList(report.RoleSignals, canonical)
	report.HiringSignals = sanitizeGitHubMentionList(report.HiringSignals, canonical)
	report.RedFlags = sanitizeGitHubMentionList(report.RedFlags, canonical)
	report.Gaps = sanitizeGitHubMentionList(report.Gaps, canonical)
	report.SourceURLs = filterSourceURLs(profile, report.SourceURLs)

	filtered := make([]models.RecruiterFinding, 0, len(report.WebFindings))
	for _, f := range report.WebFindings {
		if f.URL == "" || shouldIncludeWebSource(profile, f.URL) {
			filtered = append(filtered, f)
		}
	}
	report.WebFindings = filtered
}

func sanitizeGitHubMentionList(items []string, canonical string) []string {
	out := make([]string, 0, len(items))
	for _, item := range items {
		clean := sanitizeGitHubMentions(item, canonical)
		if strings.TrimSpace(clean) != "" {
			out = append(out, clean)
		}
	}
	return out
}

func sanitizeGitHubMentions(text, canonical string) string {
	if text == "" {
		return text
	}
	clean := githubProfileMention.ReplaceAllStringFunc(text, func(match string) string {
		sub := githubProfileMention.FindStringSubmatch(match)
		if len(sub) < 2 {
			return match
		}
		user := strings.ToLower(sub[1])
		if canonical != "" && user == canonical {
			return match
		}
		return "another GitHub user"
	})
	clean = multiGitHubAccounts.ReplaceAllString(clean, "")
	clean = githubAccountParen.ReplaceAllString(clean, "")
	return strings.TrimSpace(strings.Join(strings.Fields(clean), " "))
}
