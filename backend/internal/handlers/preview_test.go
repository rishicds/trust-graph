package handlers

import (
	"testing"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/profilesync"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

func TestPreviewShadowRefreshPreservesEnrichment(t *testing.T) {
	now := time.Now().UTC()
	existing := &models.Profile{
		Handle:      "jane-doe",
		DisplayName: "Jane Doe",
		IsShadow:    true,
		IsClaimed:   false,
		AIInsight: &models.ProfileInsight{
			Summary:     "Senior engineer with cross-platform evidence.",
			GeneratedAt: now,
		},
		RecruiterReport: &models.RecruiterReport{
			Summary:     "Strong open-source footprint.",
			GeneratedAt: now,
		},
		EnrichedSources: []models.EnrichedSource{
			{Platform: "web", URL: "https://example.com/talk", Title: "Conference talk"},
		},
		Evidence: []models.EvidenceItem{
			{Type: "web_corroboration", Title: "Blog post", Platform: "web", OccurredAt: now},
		},
	}

	stats := &githubsvc.Stats{
		User: githubsvc.UserProfile{
			Login:       "jane-doe",
			Name:        "Jane Doe",
			PublicRepos: 12,
		},
		MergedPRs:    40,
		LastActivity: now,
		ActiveSince:  now.Add(-48 * time.Hour),
	}

	profilesync.ApplyGitHub(existing, stats, true)

	if existing.AIInsight == nil || existing.AIInsight.Summary == "" {
		t.Fatal("expected AI insight to be preserved after shadow GitHub refresh")
	}
	if existing.RecruiterReport == nil || existing.RecruiterReport.Summary == "" {
		t.Fatal("expected recruiter report to be preserved after shadow GitHub refresh")
	}
	if len(existing.EnrichedSources) != 1 {
		t.Fatalf("expected enriched sources to be preserved, got %d", len(existing.EnrichedSources))
	}
	hasWebEvidence := false
	for _, item := range existing.Evidence {
		if item.Platform == "web" {
			hasWebEvidence = true
			break
		}
	}
	if !hasWebEvidence {
		t.Fatal("expected non-GitHub evidence to be preserved after shadow GitHub refresh")
	}
}
