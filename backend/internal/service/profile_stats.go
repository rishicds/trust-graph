package service

import (
	"fmt"
	"sort"
	"strings"

	"github.com/trustgraph/backend/internal/models"
)

type ProfileStat struct {
	Key      string `json:"key"`
	Label    string `json:"label"`
	Value    int    `json:"value"`
	Display  string `json:"display"`
	Platform string `json:"platform"`
	Category string `json:"category"`
	URL      string `json:"url,omitempty"`
	Verified bool   `json:"verified"`
	Detail   string `json:"detail,omitempty"`
}

func BuildProfileStats(evidence []models.EvidenceItem) []ProfileStat {
	if len(evidence) == 0 {
		return nil
	}

	evidence = preferPortfolioFlagship(evidence)

	var stats []ProfileStat

	for _, e := range evidence {
		// Identity corroboration from web search — not a quantifiable public stat.
		if e.Type == "social_identity" {
			continue
		}

		stat := evidenceToStat(e)
		if stat.Key == "" {
			continue
		}
		stats = append(stats, stat)
	}

	for _, badge := range renownBadges(evidence) {
		stats = append([]ProfileStat{badge}, stats...)
	}

	sort.SliceStable(stats, func(i, j int) bool {
		rankI := statSortRank(stats[i])
		rankJ := statSortRank(stats[j])
		if rankI != rankJ {
			return rankI < rankJ
		}
		return stats[i].Value > stats[j].Value
	})

	return stats
}

func evidenceToStat(e models.EvidenceItem) ProfileStat {
	count := max(e.Count, 0)
	label := e.Title
	category := "contribution"
	key := e.Type

	switch e.Type {
	case "community_reach":
		category = "impact"
		if count >= 10000 {
			label = "Community reach"
		} else {
			label = "GitHub followers"
		}
		key = "community_reach"
	case "open_source_impact":
		category = "impact"
		if count >= 10000 {
			label = "Open source impact"
		} else {
			label = "Stars on public repos"
		}
		key = "open_source_impact"
	case "flagship_project":
		category = "impact"
		name := flagshipName(e.Title)
		if count >= 50 {
			label = "Open source flagship"
			if name != "" {
				label = "Open source flagship · " + name
			}
		} else {
			label = "Flagship project"
			if name != "" {
				label = "Flagship project · " + name
			}
		}
		key = "flagship_project"
	case "merged_pr":
		label = "PRs merged (public)"
		category = "contribution"
	case "repository":
		if isLanguageEvidence(e) {
			category = "language"
			label = strings.TrimSuffix(e.Title, " projects")
		} else if e.Title == "Public repositories" {
			label = "Public repositories"
			category = "contribution"
		}
	case "accepted_answer":
		label = "Accepted answers"
		category = "community"
	case "hackathon_win":
		label = "Hackathon wins"
		category = "achievement"
	case "conference_talk", "publication":
		category = "achievement"
	case "social_identity":
		category = "identity"
	case "peer_reference":
		category = "peer"
		label = "Peer references"
	case "claimed_project":
		category = "claim"
	}

	detail := ""
	if e.Platform != "" {
		detail = e.Platform
	}

	display := formatStatCount(count)
	if e.Type == "flagship_project" && count < 50 {
		if name := flagshipName(e.Title); name != "" {
			display = name
		} else if strings.TrimSpace(e.Description) != "" {
			display = truncateStatText(e.Description, 48)
		}
	}

	return ProfileStat{
		Key:      key + ":" + e.Platform + ":" + e.Title,
		Label:    label,
		Value:    count,
		Display:  display,
		Platform: e.Platform,
		Category: category,
		URL:      e.URL,
		Verified: e.Verified,
		Detail:   detail,
	}
}

func renownBadges(evidence []models.EvidenceItem) []ProfileStat {
	var stars, followers, flagship int
	for _, e := range evidence {
		switch e.Type {
		case "open_source_impact":
			stars = max(stars, e.Count)
		case "community_reach":
			followers = max(followers, e.Count)
		case "flagship_project":
			flagship = max(flagship, e.Count)
		}
	}

	var badges []ProfileStat
	if stars >= 100000 {
		badges = append(badges, renownStat("renown_stars", "Exceptional open-source impact", stars, "100K+ total stars"))
	} else if stars >= 10000 {
		badges = append(badges, renownStat("renown_stars", "Notable open-source impact", stars, "10K+ total stars"))
	}
	if followers >= 100000 {
		badges = append(badges, renownStat("renown_followers", "Exceptional community reach", followers, "100K+ followers"))
	} else if followers >= 10000 {
		badges = append(badges, renownStat("renown_followers", "Strong community reach", followers, "10K+ followers"))
	}
	if flagship >= 50000 {
		badges = append(badges, renownStat("renown_flagship", "Flagship project renown", flagship, "50K+ flagship stars"))
	}
	return badges
}

func renownStat(key, label string, value int, detail string) ProfileStat {
	return ProfileStat{
		Key:      key,
		Label:    label,
		Value:    value,
		Display:  formatStatCount(value),
		Platform: "trustgraph",
		Category: "renown",
		Verified: true,
		Detail:   detail,
	}
}

func statSortRank(s ProfileStat) int {
	switch s.Category {
	case "renown":
		return 0
	case "impact":
		return 1
	case "contribution":
		return 2
	case "community":
		return 3
	case "language":
		return 4
	case "achievement":
		return 5
	case "peer":
		return 6
	default:
		return 7
	}
}

func formatStatCount(n int) string {
	if n >= 1_000_000 {
		return trimTrailingZero(fmt.Sprintf("%.1fM", float64(n)/1_000_000))
	}
	if n >= 10_000 {
		return trimTrailingZero(fmt.Sprintf("%.0fK", float64(n)/1_000))
	}
	if n >= 1_000 {
		return trimTrailingZero(fmt.Sprintf("%.1fK", float64(n)/1_000))
	}
	return fmt.Sprintf("%d", n)
}

func trimTrailingZero(s string) string {
	s = strings.Replace(s, ".0K", "K", 1)
	s = strings.Replace(s, ".0M", "M", 1)
	return s
}

func flagshipName(title string) string {
	for _, prefix := range []string{"Flagship repo: ", "Flagship project: "} {
		if strings.HasPrefix(title, prefix) {
			return strings.TrimSpace(strings.TrimPrefix(title, prefix))
		}
	}
	return strings.TrimSpace(title)
}

func truncateStatText(s string, max int) string {
	s = strings.TrimSpace(s)
	if len(s) <= max {
		return s
	}
	return strings.TrimSpace(s[:max-1]) + "…"
}

func preferPortfolioFlagship(evidence []models.EvidenceItem) []models.EvidenceItem {
	hasStrongPortfolio := false
	for _, e := range evidence {
		if e.Type == "flagship_project" && e.Platform != "github" {
			hasStrongPortfolio = true
			break
		}
	}
	if !hasStrongPortfolio {
		return evidence
	}
	out := make([]models.EvidenceItem, 0, len(evidence))
	for _, e := range evidence {
		if e.Type == "flagship_project" && e.Platform == "github" && e.Count < 25 {
			continue
		}
		out = append(out, e)
	}
	return out
}
