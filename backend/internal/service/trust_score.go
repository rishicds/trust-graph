package service

import (
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
)

const (
	weightEvidence    = 0.35
	weightConsistency = 0.25
	weightPeer        = 0.15
	weightImpact      = 0.25

	maxLanguageEvidenceItems = 4
	peerBaseline             = 35.0
)

func ComputeTrustScore(profile *models.Profile) models.TrustScore {
	evidenceScore := computeEvidenceDepth(profile)
	consistencyScore := computeConsistency(profile)
	peerScore := computePeerVerification(profile)
	impactScore := computeImpactSignals(profile)
	trustRatio := computeTrustRatio(profile)

	overall := evidenceScore*weightEvidence +
		consistencyScore*weightConsistency +
		peerScore*weightPeer +
		impactScore*weightImpact
	overall += renownBonus(profile)
	overall = math.Min(100, overall)

	positive, negative := buildSignals(profile, evidenceScore, consistencyScore, peerScore, impactScore)

	return models.TrustScore{
		Overall: math.Round(overall*10) / 10,
		Dimensions: models.ScoreDimensions{
			EvidenceDepth:    math.Round(evidenceScore*10) / 10,
			Consistency:      math.Round(consistencyScore*10) / 10,
			PeerVerification: math.Round(peerScore*10) / 10,
			ImpactSignals:    math.Round(impactScore*10) / 10,
			TrustRatio:       math.Round(trustRatio*10) / 10,
		},
		Delta:     0,
		UpdatedAt: time.Now().UTC(),
		Positive:  positive,
		Negative:  negative,
	}
}

func computeEvidenceDepth(profile *models.Profile) float64 {
	if len(profile.Evidence) == 0 {
		return 0
	}

	var score float64
	languageItems := 0
	for _, e := range profile.Evidence {
		if isLanguageEvidence(e) {
			languageItems++
			if languageItems > maxLanguageEvidenceItems {
				continue
			}
		}

		weight := 1.0
		if e.Verified {
			weight = 1.4
		}

		base := evidenceBasePoints(e)
		ageYears := time.Since(e.OccurredAt).Hours() / (24 * 365)
		decay := math.Max(0.6, 1.0-ageYears*0.05)
		score += base * weight * decay
	}

	return math.Min(100, score)
}

func evidenceBasePoints(e models.EvidenceItem) float64 {
	switch e.Type {
	case "community_reach":
		return 8 + logScaledPoints(float64(max(e.Count, 1)), 8, 22)
	case "open_source_impact":
		return 10 + logScaledPoints(float64(max(e.Count, 1)), 10, 28)
	case "flagship_project":
		return 12 + logScaledPoints(float64(max(e.Count, 1)), 12, 30)
	case "merged_pr", "repository", "hackathon_win", "conference_talk":
		base := 6.0
		if e.Count > 0 {
			base += math.Min(float64(e.Count)*0.15, 8)
		}
		return base
	case "accepted_answer", "publication":
		base := 5.0
		if e.Count > 0 {
			base += math.Min(float64(e.Count)*0.15, 8)
		}
		return base
	case "web_corroboration", "recruiter_insight", "social_identity", "ai_insight":
		base := 5.0
		if e.Count > 0 {
			base += math.Min(float64(e.Count)*0.2, 8)
		}
		return base
	default:
		base := 4.0
		if e.Count > 0 {
			base += math.Min(float64(e.Count)*0.12, 6)
		}
		return base
	}
}

func isLanguageEvidence(e models.EvidenceItem) bool {
	return e.Type == "repository" && strings.HasSuffix(e.Title, " projects")
}

func logScaledPoints(value float64, minPoints, maxPoints float64) float64 {
	if value <= 1 {
		return minPoints
	}
	// log10(100)=2, log10(10k)=4, log10(1M)=6
	scale := math.Log10(value)
	return minPoints + math.Min(scale/6*maxPoints, maxPoints)
}

// renownBonus rewards exceptional open-source reach that raw evidence depth caps can flatten.
func renownBonus(profile *models.Profile) float64 {
	var stars, followers, flagship int
	for _, e := range profile.Evidence {
		switch e.Type {
		case "open_source_impact":
			stars = max(stars, e.Count)
		case "community_reach":
			followers = max(followers, e.Count)
		case "flagship_project":
			flagship = max(flagship, e.Count)
		}
	}
	var bonus float64
	if stars >= 100000 {
		bonus += 6
	} else if stars >= 10000 {
		bonus += 3
	}
	if followers >= 100000 {
		bonus += 4
	} else if followers >= 10000 {
		bonus += 2
	}
	if flagship >= 50000 {
		bonus += 3
	}
	return bonus
}

func computeConsistency(profile *models.Profile) float64 {
	if profile.ActiveSince.IsZero() {
		return 20
	}

	yearsActive := time.Since(profile.ActiveSince).Hours() / (24 * 365)
	if yearsActive < 0.25 {
		return 35
	}

	daysSinceActivity := time.Since(profile.LastActivityAt).Hours() / 24
	activityPenalty := 0.0
	if daysSinceActivity > 90 {
		monthsInactive := (daysSinceActivity - 90) / 30
		activityPenalty = monthsInactive * 0.5
	}

	base := 40 + math.Min(yearsActive*12, 45)
	return math.Max(0, math.Min(100, base-activityPenalty*5))
}

func computePeerVerification(profile *models.Profile) float64 {
	verified := 0
	for _, e := range profile.Evidence {
		if e.Type == "peer_reference" && e.Verified {
			verified++
		}
	}
	score := float64(verified) * 25
	if score == 0 && hasVerifiedPlatformEvidence(profile) {
		return peerBaseline
	}
	return math.Min(100, score)
}

func hasVerifiedPlatformEvidence(profile *models.Profile) bool {
	for _, e := range profile.Evidence {
		if e.Verified && e.Platform != "" && e.Type != "claimed_project" {
			return true
		}
	}
	return false
}

func computeTrustRatio(profile *models.Profile) float64 {
	if len(profile.Evidence) == 0 {
		return 50
	}
	verified := 0
	for _, e := range profile.Evidence {
		if e.Verified {
			verified++
		}
	}
	ratio := float64(verified) / float64(len(profile.Evidence))
	return math.Min(100, 40+ratio*60)
}

func computeImpactSignals(profile *models.Profile) float64 {
	var impact float64
	for _, e := range profile.Evidence {
		switch e.Type {
		case "community_reach":
			impact += logScaledPoints(float64(max(e.Count, 1)), 10, 25)
		case "open_source_impact":
			impact += logScaledPoints(float64(max(e.Count, 1)), 15, 35)
		case "flagship_project":
			impact += logScaledPoints(float64(max(e.Count, 1)), 15, 35)
		case "hackathon_win", "conference_talk", "publication":
			impact += math.Min(float64(max(e.Count, 1))*2.5, 20)
		case "repository":
			if isLanguageEvidence(e) {
				continue
			}
			impact += math.Min(float64(max(e.Count, 1))*2.5, 20)
		case "merged_pr":
			impact += math.Min(float64(max(e.Count, 1))*0.5, 15)
		case "social_identity":
			impact += 8
		}
	}
	if impact == 0 && len(profile.Evidence) > 0 {
		return computeTrustRatio(profile)
	}
	return math.Min(100, 30+impact)
}

func ComputeProfileCompleteness(profile *models.Profile) float64 {
	if profile == nil {
		return 0
	}
	points := 0.0
	if len(profile.DataSources) > 0 {
		points += 25
	}
	for _, s := range profile.DataSources {
		if s.Connected {
			points += 15
		}
	}
	if len(profile.Evidence) > 0 {
		points += 20
	}
	if profile.TrustScore.Overall > 0 {
		points += 20
	}
	if len(profile.Capabilities) > 0 {
		points += 10
	}
	return math.Min(100, points)
}

func EstimateScoreRange(profile *models.Profile) (float64, float64) {
	if len(profile.Evidence) > 0 {
		score := ComputeTrustScore(profile)
		return score.Overall - 5, score.Overall + 5
	}
	completeness := ComputeProfileCompleteness(profile)
	if completeness >= 40 {
		return 45, 60
	}
	return 35, 50
}

func buildSignals(profile *models.Profile, evidence, consistency, peer, impact float64) ([]string, []string) {
	var positive, negative []string

	prCount := 0
	repoCount := 0
	starCount := 0
	followers := 0
	unverifiedClaims := 0
	for _, e := range profile.Evidence {
		switch e.Type {
		case "merged_pr":
			prCount += max(e.Count, 1)
		case "repository":
			if e.Title == "Public repositories" {
				repoCount += max(e.Count, 1)
			}
		case "open_source_impact":
			starCount += max(e.Count, 1)
		case "community_reach":
			followers += max(e.Count, 1)
		case "flagship_project":
			positive = append(positive, fmt.Sprintf("Flagship project with %d stars (%s)", e.Count, strings.TrimPrefix(e.Title, "Flagship repo: ")))
		}
		if !e.Verified && e.Type == "claimed_project" {
			unverifiedClaims++
		}
	}

	if starCount >= 10000 {
		positive = append(positive, fmt.Sprintf("Open source impact (%d GitHub stars)", starCount))
	} else if starCount > 0 {
		positive = append(positive, fmt.Sprintf("%d stars on public repos", starCount))
	}
	if followers >= 10000 {
		positive = append(positive, fmt.Sprintf("Community reach (%d GitHub followers)", followers))
	} else if followers > 0 {
		positive = append(positive, fmt.Sprintf("%d GitHub followers", followers))
	}
	if prCount > 0 {
		positive = append(positive, fmt.Sprintf("%d PRs merged on public repos", prCount))
	}
	if repoCount > 0 {
		positive = append(positive, fmt.Sprintf("%d public repositories", repoCount))
	}
	if consistency >= 70 {
		positive = append(positive, "Multi-year consistency with sustained public activity")
	}
	if evidence >= 60 {
		positive = append(positive, "Strong evidence depth across connected platforms")
	}
	if impact >= 75 {
		positive = append(positive, "High impact signals from public repositories and community")
	}
	if renownBonus(profile) >= 6 {
		positive = append(positive, "Exceptional open-source reach and community impact")
	}

	if unverifiedClaims > 0 {
		negative = append(negative, fmt.Sprintf("%d claimed projects without public repository or demo link", unverifiedClaims))
	}
	if peer <= peerBaseline+5 {
		negative = append(negative, "Peer verification pending — send reference requests to boost score")
	}
	if consistency < 50 {
		negative = append(negative, "Consistency score impacted by recent inactivity")
	}

	return positive, negative
}

func ScoreBand(score float64) string {
	lower := int(math.Floor(score/10)) * 10
	upper := lower + 10
	if upper > 100 {
		upper = 100
	}
	return fmt.Sprintf("%d-%d", lower, upper)
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
