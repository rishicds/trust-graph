package recruiter

import (
	"regexp"
	"strings"

	"github.com/trustgraph/backend/internal/models"
)

var (
	workedAtRe     = regexp.MustCompile(`(?i)(?:worked|working|employed|intern(?:ed|ship)?)\s+(?:at|for|with)\s+([a-z0-9][a-z0-9\s&.-]{1,48})`)
	exEmployerRe   = regexp.MustCompile(`(?i)\bex[-\s@]([a-z0-9][a-z0-9\s&.-]{1,48})`)
	livesInRe      = regexp.MustCompile(`(?i)(?:lives?|based|located|from)\s+in\s+([a-z][a-z\s,.'-]{1,48})`)
	proficientInRe = regexp.MustCompile(`(?i)(?:proficient|skilled|strong|experienced|expert)\s+in\s+([^,.;\n]+)`)
	workedOnRe     = regexp.MustCompile(`(?i)worked\s+on\s+([^,.;\n]+)`)
	usingToolsRe   = regexp.MustCompile(`(?i)(?:using|with)\s+([a-z0-9][a-z0-9\s,/+.-]{1,64})\s+(?:tools?|stack|frameworks?)`)
)

var employerAliases = map[string][]string{
	"devrelsquad": {"devrelsquad", "devrel squad", "devrel-squad", "drs"},
	"devrel squad": {"devrelsquad", "devrel squad", "devrel-squad", "drs"},
	"drs":           {"devrelsquad", "devrel squad", "drs"},
}

func ParseRecruiterQuery(raw string) models.ParsedRecruiterQuery {
	raw = strings.TrimSpace(raw)
	parsed := models.ParsedRecruiterQuery{Raw: raw}

	for _, m := range workedAtRe.FindAllStringSubmatch(raw, -1) {
		if len(m) > 1 {
			parsed.Employers = appendUniqueStrings(parsed.Employers, cleanPhrase(m[1]))
			parsed.RequireEmployer = true
		}
	}
	for _, m := range exEmployerRe.FindAllStringSubmatch(raw, -1) {
		if len(m) > 1 {
			parsed.Employers = appendUniqueStrings(parsed.Employers, cleanPhrase(m[1]))
			parsed.RequireEmployer = true
		}
	}
	if m := livesInRe.FindStringSubmatch(raw); len(m) > 1 {
		parsed.Location = cleanPhrase(m[1])
	}
	for _, m := range proficientInRe.FindAllStringSubmatch(raw, -1) {
		if len(m) > 1 {
			for _, skill := range splitList(m[1]) {
				parsed.Skills = appendUniqueStrings(parsed.Skills, skill)
			}
		}
	}
	for _, m := range workedOnRe.FindAllStringSubmatch(raw, -1) {
		if len(m) > 1 {
			for _, tool := range splitList(m[1]) {
				parsed.Tools = appendUniqueStrings(parsed.Tools, tool)
			}
		}
	}
	if m := usingToolsRe.FindStringSubmatch(raw); len(m) > 1 {
		for _, tool := range splitList(m[1]) {
			parsed.Tools = appendUniqueStrings(parsed.Tools, tool)
		}
	}

	// Bare company name in "who worked at X" style queries without regex capture edge cases.
	lower := strings.ToLower(raw)
	if strings.Contains(lower, "devrelsquad") || strings.Contains(lower, "devrel squad") {
		parsed.Employers = appendUniqueStrings(parsed.Employers, "devrelsquad")
		parsed.RequireEmployer = true
	}

	return parsed
}

func MergeQueryAndFilters(parsed models.ParsedRecruiterQuery, filters models.RecruiterSearchFilters) models.ParsedRecruiterQuery {
	if loc := strings.TrimSpace(filters.Location); loc != "" {
		parsed.Location = loc
	}
	if len(filters.Skills) > 0 {
		parsed.Skills = appendUniqueStrings(parsed.Skills, filters.Skills...)
	}
	if len(filters.Tools) > 0 {
		parsed.Tools = appendUniqueStrings(parsed.Tools, filters.Tools...)
	}
	if len(filters.Employers) > 0 {
		parsed.Employers = appendUniqueStrings(parsed.Employers, filters.Employers...)
	}
	if filters.RequireEmployer != nil {
		parsed.RequireEmployer = *filters.RequireEmployer
	}
	if len(parsed.Employers) > 0 && !parsed.RequireEmployer {
		parsed.RequireEmployer = true
	}
	return parsed
}

func employerVariants(employer string) []string {
	key := strings.ToLower(strings.TrimSpace(employer))
	if key == "" {
		return nil
	}
	if aliases, ok := employerAliases[key]; ok {
		return aliases
	}
	out := []string{key}
	compact := strings.ReplaceAll(key, " ", "")
	if compact != key {
		out = append(out, compact)
	}
	spaced := strings.ReplaceAll(compact, "-", " ")
	if spaced != key && spaced != compact {
		out = append(out, spaced)
	}
	return out
}

func profileMentionsEmployer(corpus string, employer string) bool {
	corpus = strings.ToLower(corpus)
	for _, variant := range employerVariants(employer) {
		if variant != "" && strings.Contains(corpus, variant) {
			return true
		}
	}
	return false
}

func profileMatchesRequirements(corpus string, parsed models.ParsedRecruiterQuery) (bool, []models.MatchSignal) {
	var signals []models.MatchSignal

	if parsed.RequireEmployer && len(parsed.Employers) > 0 {
		matched := false
		for _, employer := range parsed.Employers {
			if profileMentionsEmployer(corpus, employer) {
				matched = true
				signals = append(signals, models.MatchSignal{
					Category: "employer",
					Label:    "Employer match: " + employer,
					Detail:   "Profile mentions this company or org in bio, evidence, or enriched sources",
					Source:   "TrustGraph index",
					Weight:   120,
				})
				break
			}
		}
		if !matched {
			return false, nil
		}
	}

	if loc := strings.TrimSpace(parsed.Location); loc != "" {
		if !strings.Contains(corpus, strings.ToLower(loc)) {
			return false, nil
		}
		signals = append(signals, models.MatchSignal{
			Category: "location",
			Label:    "Location: " + loc,
			Detail:   "Profile corpus mentions this location",
			Source:   "TrustGraph index",
			Weight:   70,
		})
	}

	for _, skill := range parsed.Skills {
		needle := strings.ToLower(strings.TrimSpace(skill))
		if needle == "" {
			continue
		}
		if !strings.Contains(corpus, needle) {
			return false, nil
		}
		signals = append(signals, models.MatchSignal{
			Category: "capability",
			Label:    "Skill: " + skill,
			Detail:   "Profile mentions this skill or technology",
			Source:   "TrustGraph index",
			Weight:   55,
		})
	}

	for _, tool := range parsed.Tools {
		needle := strings.ToLower(strings.TrimSpace(tool))
		if needle == "" {
			continue
		}
		if !strings.Contains(corpus, needle) {
			return false, nil
		}
		signals = append(signals, models.MatchSignal{
			Category: "evidence",
			Label:    "Tool/stack: " + tool,
			Detail:   "Profile mentions experience with this tool or stack",
			Source:   "TrustGraph index",
			Weight:   50,
		})
	}

	return true, signals
}

func cleanPhrase(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimRight(s, ".,;!?")
	lower := strings.ToLower(s)
	for _, stop := range []string{", worked", " worked", " who ", " and ", " with ", " that ", " proficient", " using"} {
		if idx := strings.Index(lower, stop); idx > 0 {
			s = strings.TrimSpace(s[:idx])
			lower = strings.ToLower(s)
		}
	}
	return strings.TrimSpace(s)
}

func splitList(s string) []string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	parts := strings.FieldsFunc(s, func(r rune) bool {
		return r == ',' || r == ';' || r == '/' || r == '&'
	})
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func appendUniqueStrings(base []string, items ...string) []string {
	seen := map[string]struct{}{}
	for _, s := range base {
		seen[strings.ToLower(s)] = struct{}{}
	}
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		key := strings.ToLower(item)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		base = append(base, item)
	}
	return base
}
