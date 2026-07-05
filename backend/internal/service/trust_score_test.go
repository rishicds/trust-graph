package service

import (
	"testing"
	"time"

	"github.com/trustgraph/backend/internal/models"
)

func TestHighImpactMaintainerScoresAboveActiveContributor(t *testing.T) {
	now := time.Now().UTC()
	since := now.AddDate(-10, 0, 0)

	linus := &models.Profile{
		ActiveSince:    since,
		LastActivityAt: now,
		Evidence: []models.EvidenceItem{
			{Type: "merged_pr", Title: "Merged pull requests on GitHub", Platform: "github", Verified: true, Count: 69, OccurredAt: now},
			{Type: "repository", Title: "Public repositories", Platform: "github", Verified: true, Count: 12, OccurredAt: now},
			{Type: "community_reach", Title: "GitHub followers", Platform: "github", Verified: true, Count: 305956, OccurredAt: now},
			{Type: "open_source_impact", Title: "GitHub repository stars", Platform: "github", Verified: true, Count: 247921, OccurredAt: now},
			{Type: "flagship_project", Title: "Flagship repo: linux", Platform: "github", Verified: true, Count: 200000, OccurredAt: now},
			{Type: "repository", Title: "C projects", Platform: "github", Verified: true, Count: 10, OccurredAt: now},
		},
	}

	rishi := &models.Profile{
		ActiveSince:    now.AddDate(-5, 0, 0),
		LastActivityAt: now,
		Evidence: []models.EvidenceItem{
			{Type: "merged_pr", Title: "Merged pull requests on GitHub", Platform: "github", Verified: true, Count: 88, OccurredAt: now},
			{Type: "repository", Title: "Public repositories", Platform: "github", Verified: true, Count: 62, OccurredAt: now},
			{Type: "community_reach", Title: "GitHub followers", Platform: "github", Verified: true, Count: 40, OccurredAt: now},
			{Type: "open_source_impact", Title: "GitHub repository stars", Platform: "github", Verified: true, Count: 14, OccurredAt: now},
			{Type: "repository", Title: "TypeScript projects", Platform: "github", Verified: true, Count: 21, OccurredAt: now},
			{Type: "repository", Title: "HTML projects", Platform: "github", Verified: true, Count: 10, OccurredAt: now},
			{Type: "repository", Title: "Python projects", Platform: "github", Verified: true, Count: 5, OccurredAt: now},
			{Type: "repository", Title: "JavaScript projects", Platform: "github", Verified: true, Count: 7, OccurredAt: now},
		},
	}

	linusScore := ComputeTrustScore(linus).Overall
	rishiScore := ComputeTrustScore(rishi).Overall

	if linusScore <= rishiScore {
		t.Fatalf("expected high-impact maintainer (%.1f) above active contributor (%.1f)", linusScore, rishiScore)
	}
}

func TestLanguageEvidenceIsCapped(t *testing.T) {
	now := time.Now().UTC()
	items := []models.EvidenceItem{
		{Type: "merged_pr", Title: "Merged pull requests on GitHub", Platform: "github", Verified: true, Count: 50, OccurredAt: now},
	}
	for i := 0; i < 10; i++ {
		items = append(items, models.EvidenceItem{
			Type: "repository", Title: "Lang projects", Platform: "github", Verified: true, Count: 5, OccurredAt: now,
		})
	}
	withManyLangs := &models.Profile{
		ActiveSince: now.AddDate(-3, 0, 0), LastActivityAt: now, Evidence: items,
	}
	withFewLangs := &models.Profile{
		ActiveSince: now.AddDate(-3, 0, 0), LastActivityAt: now,
		Evidence: append([]models.EvidenceItem{}, items[:5]...),
	}

	many := ComputeTrustScore(withManyLangs).Overall
	few := ComputeTrustScore(withFewLangs).Overall
	if many-few > 8 {
		t.Fatalf("language spam should not dominate score: many=%.1f few=%.1f", many, few)
	}
}
