package profilesync

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service"
	devfoliosvc "github.com/trustgraph/backend/internal/service/devfolio"
	devpostsvc "github.com/trustgraph/backend/internal/service/devpost"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
	stackoverflowsvc "github.com/trustgraph/backend/internal/service/stackoverflow"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func ApplyGitHub(profile *models.Profile, stats *githubsvc.Stats, verified bool) {
	now := time.Now().UTC()
	profile.DataSources = upsertSource(profile.DataSources, models.DataSource{
		Platform:    "github",
		ExternalID:  stats.User.Login,
		Connected:   true,
		ConnectedAt: now,
	})

	profile.Evidence = removePlatformEvidence(profile.Evidence, "github")
	repoCount := stats.User.PublicRepos
	if repoCount == 0 {
		repoCount = len(stats.Repos)
	}

	profile.Evidence = append(profile.Evidence,
		models.EvidenceItem{
			Type:       "merged_pr",
			Title:      "Merged pull requests on GitHub",
			Platform:   "github",
			Verified:   verified,
			Count:      stats.MergedPRs,
			URL:        fmt.Sprintf("https://github.com/%s", stats.User.Login),
			OccurredAt: stats.LastActivity,
		},
		models.EvidenceItem{
			Type:       "repository",
			Title:      "Public repositories",
			Platform:   "github",
			Verified:   verified,
			Count:      repoCount,
			URL:        fmt.Sprintf("https://github.com/%s?tab=repositories", stats.User.Login),
			OccurredAt: stats.LastActivity,
		},
	)

	if stats.User.Followers > 0 {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "community_reach",
			Title:      "GitHub followers",
			Platform:   "github",
			Verified:   verified,
			Count:      stats.User.Followers,
			URL:        fmt.Sprintf("https://github.com/%s?tab=followers", stats.User.Login),
			OccurredAt: stats.LastActivity,
		})
	}

	if stats.TotalStars > 0 {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "open_source_impact",
			Title:      "GitHub repository stars",
			Platform:   "github",
			Verified:   verified,
			Count:      stats.TotalStars,
			URL:        fmt.Sprintf("https://github.com/%s?tab=repositories", stats.User.Login),
			OccurredAt: stats.LastActivity,
		})
	}

	if stats.TopRepoStars > 0 && stats.TopRepoName != "" {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "flagship_project",
			Title:      fmt.Sprintf("Flagship repo: %s", stats.TopRepoName),
			Platform:   "github",
			Verified:   verified,
			Count:      stats.TopRepoStars,
			URL:        stats.TopRepoURL,
			OccurredAt: stats.LastActivity,
		})
	}

	langPairs := make([]struct {
		name  string
		count int
	}, 0, len(stats.Languages))
	for lang, count := range stats.Languages {
		if count > 0 {
			langPairs = append(langPairs, struct {
				name  string
				count int
			}{lang, count})
		}
	}
	sort.Slice(langPairs, func(i, j int) bool {
		if langPairs[i].count != langPairs[j].count {
			return langPairs[i].count > langPairs[j].count
		}
		return langPairs[i].name < langPairs[j].name
	})
	for _, lc := range langPairs {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "repository",
			Title:      fmt.Sprintf("%s projects", lc.name),
			Platform:   "github",
			Verified:   verified,
			Count:      lc.count,
			OccurredAt: stats.LastActivity,
		})
	}

	if stats.User.Bio != "" && profile.Headline == "" {
		profile.Headline = stats.User.Bio
	}
	if stats.User.AvatarURL != "" {
		profile.AvatarURL = stats.User.AvatarURL
	}
	if stats.User.Name != "" {
		profile.DisplayName = stats.User.Name
	}

	profile.SocialLinks = mapSocialLinks(stats.SocialLinks)
	profile.GitHubPublicEmail = strings.TrimSpace(stats.User.PublicEmail)

	profile.ActiveSince = stats.ActiveSince
	profile.LastActivityAt = stats.LastActivity
	profile.Capabilities = deriveCapabilities(profile.Evidence)
	profile.Timeline = BuildTimeline(profile.Evidence, profile.TrustScore.Overall)
	profile.OnboardingStep = maxStep(profile.OnboardingStep, 2)
	recomputeScore(profile)
}

func ApplyStackOverflow(profile *models.Profile, stats *stackoverflowsvc.UserStats) {
	now := time.Now().UTC()
	profile.DataSources = upsertSource(profile.DataSources, models.DataSource{
		Platform:    "stackoverflow",
		ExternalID:  stats.Username,
		Connected:   true,
		ConnectedAt: now,
	})

	profile.Evidence = removePlatformEvidence(profile.Evidence, "stackoverflow")
	profile.Evidence = append(profile.Evidence, models.EvidenceItem{
		Type:       "accepted_answer",
		Title:      "Stack Overflow accepted answers",
		Platform:   "stackoverflow",
		Verified:   true,
		Count:      stats.AcceptedAnswers,
		URL:        stats.ProfileURL,
		OccurredAt: now,
	})

	profile.Capabilities = deriveCapabilities(profile.Evidence)
	profile.Timeline = BuildTimeline(profile.Evidence, profile.TrustScore.Overall)
	profile.OnboardingStep = maxStep(profile.OnboardingStep, 3)
	recomputeScore(profile)
}

func BuildShadowProfile(handle string, stats *githubsvc.Stats) *models.Profile {
	now := time.Now().UTC()
	profile := &models.Profile{
		Handle:      handle,
		DisplayName: stats.User.Name,
		Headline:    stats.User.Bio,
		AvatarURL:   stats.User.AvatarURL,
		IsShadow:    true,
		IsClaimed:   false,
		ActiveSince: stats.ActiveSince,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	ApplyGitHub(profile, stats, true)
	return profile
}

func BuildTimeline(evidence []models.EvidenceItem, score float64) []models.TimelineEvent {
	events := make([]models.TimelineEvent, 0, len(evidence)+1)
	for _, e := range evidence {
		label := e.Title
		if e.Count > 0 {
			label = fmt.Sprintf("%s (%d)", e.Title, e.Count)
		}
		events = append(events, models.TimelineEvent{
			ID:         primitive.NewObjectID(),
			Label:      label,
			Type:       e.Type,
			Platform:   e.Platform,
			Verified:   e.Verified,
			OccurredAt: e.OccurredAt,
		})
	}
	sort.Slice(events, func(i, j int) bool {
		return events[i].OccurredAt.Before(events[j].OccurredAt)
	})
	if score >= 80 {
		events = append(events, models.TimelineEvent{
			ID:         primitive.NewObjectID(),
			Label:      fmt.Sprintf("Trust score crossed %.0f", score),
			Type:       "score_milestone",
			Platform:   "trustgraph",
			Verified:   true,
			OccurredAt: time.Now().UTC(),
		})
	}
	return events
}

func deriveCapabilities(evidence []models.EvidenceItem) []models.Capability {
	categoryCounts := map[string]int{}
	languageCounts := map[string]int{}

	for _, e := range evidence {
		if isLanguageEvidenceItem(e) {
			lang := languageNameFromEvidence(e)
			if lang != "" {
				languageCounts[lang] = max(languageCounts[lang], e.Count)
				for category, weight := range languageCategoryWeights(lang, e.Count) {
					categoryCounts[category] += weight
				}
			}
			continue
		}

		switch e.Type {
		case "merged_pr", "repository":
			if !isLanguageEvidenceItem(e) {
				categoryCounts["Open Source"] += max(1, e.Count)
			}
		case "accepted_answer":
			categoryCounts["Community"] += max(1, e.Count)
		case "hackathon_win", "conference_talk", "publication":
			categoryCounts["Achievements"] += max(1, e.Count)
		}
	}

	if len(categoryCounts) == 0 && len(languageCounts) == 0 {
		return []models.Capability{{Name: "Open Source", Evidence: 1, Verified: true}}
	}

	caps := make([]models.Capability, 0, len(categoryCounts)+len(languageCounts))
	for _, name := range sortedCapabilityNames(categoryCounts) {
		caps = append(caps, models.Capability{Name: name, Evidence: categoryCounts[name], Verified: true})
	}

	langNames := make([]string, 0, len(languageCounts))
	for name := range languageCounts {
		langNames = append(langNames, name)
	}
	sort.Slice(langNames, func(i, j int) bool {
		if languageCounts[langNames[i]] != languageCounts[langNames[j]] {
			return languageCounts[langNames[i]] > languageCounts[langNames[j]]
		}
		return langNames[i] < langNames[j]
	})
	for _, name := range langNames {
		caps = append(caps, models.Capability{Name: name, Evidence: languageCounts[name], Verified: true})
	}

	return caps
}

func isLanguageEvidenceItem(e models.EvidenceItem) bool {
	return e.Type == "repository" && strings.HasSuffix(e.Title, " projects")
}

func languageNameFromEvidence(e models.EvidenceItem) string {
	return strings.TrimSpace(strings.TrimSuffix(e.Title, " projects"))
}

func sortedCapabilityNames(counts map[string]int) []string {
	order := []string{"Backend", "Frontend", "Mobile", "DevOps", "Open Source", "Community", "Achievements"}
	names := make([]string, 0, len(counts))
	seen := map[string]bool{}
	for _, name := range order {
		if counts[name] > 0 {
			names = append(names, name)
			seen[name] = true
		}
	}
	rest := make([]string, 0, len(counts))
	for name := range counts {
		if !seen[name] {
			rest = append(rest, name)
		}
	}
	sort.Strings(rest)
	return append(names, rest...)
}

func languageCategoryWeights(lang string, repoCount int) map[string]int {
	weight := max(1, repoCount)
	lang = strings.ToLower(strings.TrimSpace(lang))
	out := map[string]int{}

	add := func(category string, multiplier int) {
		out[category] += weight * multiplier
	}

	switch lang {
	case "swift", "kotlin", "dart":
		add("Mobile", 2)
	case "javascript", "typescript", "css", "html", "vue", "svelte":
		add("Frontend", 2)
	case "go", "python", "java", "ruby", "php", "c#", "scala", "rust", "c", "c++":
		add("Backend", 2)
	case "shell", "dockerfile", "hcl", "yaml", "powershell", "makefile":
		add("DevOps", 2)
	default:
		add("Open Source", 1)
	}

	return out
}

func recomputeScore(profile *models.Profile) {
	RecomputeScore(profile)
}

func RecomputeScore(profile *models.Profile) {
	if profile.ScoreOverride {
		return
	}
	previous := profile.TrustScore.Overall
	score := service.ComputeTrustScore(profile)
	if previous > 0 {
		score.Delta = score.Overall - previous
	}
	profile.TrustScore = score
	profile.Timeline = BuildTimeline(profile.Evidence, profile.TrustScore.Overall)
}

func upsertSource(sources []models.DataSource, source models.DataSource) []models.DataSource {
	for i, s := range sources {
		if s.Platform == source.Platform {
			sources[i] = source
			return sources
		}
	}
	return append(sources, source)
}

func removePlatformEvidence(items []models.EvidenceItem, platform string) []models.EvidenceItem {
	out := make([]models.EvidenceItem, 0, len(items))
	for _, item := range items {
		if item.Platform != platform {
			out = append(out, item)
		}
	}
	return out
}

func maxStep(current, next int) int {
	if next > current {
		return next
	}
	return current
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func ApplyDevpost(profile *models.Profile, stats *devpostsvc.UserStats) {
	now := time.Now().UTC()
	profile.DataSources = upsertSource(profile.DataSources, models.DataSource{
		Platform:    "devpost",
		ExternalID:  stats.Username,
		Connected:   true,
		ConnectedAt: now,
	})
	profile.Evidence = append(profile.Evidence, models.EvidenceItem{
		Type:       "hackathon_win",
		Title:      "Devpost hackathon projects",
		Platform:   "devpost",
		Verified:   true,
		Count:      stats.ProjectCount,
		URL:        stats.ProfileURL,
		OccurredAt: now,
	})
	if stats.WinCount > 0 {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "hackathon_win",
			Title:      "Hackathon wins",
			Platform:   "devpost",
			Verified:   true,
			Count:      stats.WinCount,
			URL:        stats.ProfileURL,
			OccurredAt: now,
		})
	}
	profile.OnboardingStep = maxStep(profile.OnboardingStep, 3)
	recomputeScore(profile)
}

func ApplyDevfolio(profile *models.Profile, stats *devfoliosvc.DevfolioStats) {
	now := time.Now().UTC()
	username := stats.Username
	if username == "" {
		username = devfoliosvc.UsernameFromProfileURL(stats.ProfileURL)
	}
	profile.DataSources = upsertSource(profile.DataSources, models.DataSource{
		Platform:    "devfolio",
		ExternalID:  username,
		Connected:   true,
		ConnectedAt: now,
	})
	profile.Evidence = removePlatformEvidence(profile.Evidence, "devfolio")
	evidenceCount := len(profile.Evidence)

	if stats.TotalWins > 0 {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "hackathon_win",
			Title:      "Devfolio hackathon wins",
			Platform:   "devfolio",
			Verified:   true,
			Count:      stats.TotalWins,
			URL:        stats.ProfileURL,
			OccurredAt: now,
		})
	}

	for _, h := range stats.Hackathons {
		title := h.Name
		if h.Result != "" {
			title = fmt.Sprintf("%s — %s", h.Name, h.Result)
		}
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "hackathon_win",
			Title:      title,
			Platform:   "devfolio",
			Verified:   true,
			Count:      1,
			URL:        h.URL,
			OccurredAt: now,
		})
	}

	for _, p := range stats.Projects {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:        "hackathon_win",
			Title:       fmt.Sprintf("Project: %s", p.Name),
			Platform:    "devfolio",
			Verified:    true,
			URL:         p.URL,
			Description: truncateText(p.Description, 240),
			OccurredAt:  now,
		})
	}

	if len(profile.Evidence) == evidenceCount {
		profile.Evidence = append(profile.Evidence, models.EvidenceItem{
			Type:       "hackathon_win",
			Title:      "Devfolio profile connected",
			Platform:   "devfolio",
			Verified:   true,
			Count:      1,
			URL:        stats.ProfileURL,
			OccurredAt: now,
		})
	}

	profile.OnboardingStep = maxStep(profile.OnboardingStep, 3)
	recomputeScore(profile)
}

func truncateText(s string, max int) string {
	if max <= 0 || len(s) <= max {
		return s
	}
	return strings.TrimSpace(s[:max-1]) + "…"
}

func ApplyLinkedIn(profile *models.Profile, username, displayName string) {
	now := time.Now().UTC()
	profile.DataSources = upsertSource(profile.DataSources, models.DataSource{
		Platform:    "linkedin",
		ExternalID:  username,
		Connected:   true,
		ConnectedAt: now,
	})
	profile.Evidence = removePlatformEvidence(profile.Evidence, "linkedin")
	profile.Evidence = append(profile.Evidence, models.EvidenceItem{
		Type:       "social_identity",
		Title:      "LinkedIn identity verified via Clerk",
		Platform:   "linkedin",
		Verified:   true,
		Count:      1,
		URL:        fmt.Sprintf("https://linkedin.com/in/%s", username),
		OccurredAt: now,
	})
	if displayName != "" && profile.DisplayName == "" {
		profile.DisplayName = displayName
	}
	profile.OnboardingStep = maxStep(profile.OnboardingStep, 2)
	recomputeScore(profile)
}

func ApplyManualClaim(profile *models.Profile, claimType, title, url string) {
	now := time.Now().UTC()
	evidenceType := "claimed_project"
	switch claimType {
	case "conference_talk", "talk":
		evidenceType = "conference_talk"
	case "publication":
		evidenceType = "publication"
	case "hackathon_win":
		evidenceType = "hackathon_win"
	case "job_application":
		evidenceType = "job_application"
	}
	profile.Evidence = append(profile.Evidence, models.EvidenceItem{
		Type:       evidenceType,
		Title:      title,
		Platform:   "manual",
		Verified:   url != "",
		Count:      1,
		URL:        url,
		OccurredAt: now,
	})
	recomputeScore(profile)
}

func FinalizeProfileMetrics(profile *models.Profile) {
	profile.ProfileCompleteness = service.ComputeProfileCompleteness(profile)
	min, max := service.EstimateScoreRange(profile)
	profile.EstimatedScoreMin = min
	profile.EstimatedScoreMax = max
}
