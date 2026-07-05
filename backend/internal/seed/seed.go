package seed

import (
	"context"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service"
)

func DemoProfiles(ctx context.Context, store *repository.Store) error {
	demos := []models.Profile{
		buildShadowProfile("marcus-dev", "Marcus Rivera", "Open Source Maintainer · Systems", 84.0),
		buildShadowProfile("priya-k", "Priya Kapoor", "Full-stack · DevRel", 79.0),
	}

	for i := range demos {
		existing, err := store.FindProfileByHandle(ctx, demos[i].Handle)
		if err == nil && existing != nil {
			continue
		}
		if err := store.CreateProfile(ctx, &demos[i]); err != nil {
			return err
		}
	}
	return nil
}

func buildShadowProfile(handle, name, headline string, target float64) models.Profile {
	now := time.Now().UTC()
	activeSince := now.AddDate(-4, 0, 0)

	evidence := []models.EvidenceItem{
		{Type: "merged_pr", Title: "Merged pull requests", Platform: "github", Verified: true, Count: 240, OccurredAt: now.AddDate(0, -1, 0)},
		{Type: "repository", Title: "Public repositories", Platform: "github", Verified: true, Count: 37, OccurredAt: now.AddDate(-2, 0, 0)},
		{Type: "conference_talk", Title: "Conference talks", Platform: "sessionize", Verified: true, Count: 4, OccurredAt: now.AddDate(-1, -3, 0)},
		{Type: "hackathon_win", Title: "Hackathon wins", Platform: "devpost", Verified: true, Count: 3, OccurredAt: now.AddDate(-1, -6, 0)},
		{Type: "claimed_project", Title: "Internal tooling project", Platform: "manual", Verified: false, Count: 1, OccurredAt: now.AddDate(0, -4, 0)},
	}

	profile := models.Profile{
		Handle:         handle,
		DisplayName:    name,
		Headline:       headline,
		IsShadow:       true,
		IsClaimed:      false,
		OnboardingStep: 0,
		DataSources: []models.DataSource{
			{Platform: "github", ExternalID: handle, Connected: true, ConnectedAt: now.AddDate(-1, 0, 0)},
		},
		Evidence:       evidence,
		Capabilities: []models.Capability{
			{Name: "Backend", Evidence: 89, Verified: true},
			{Name: "AI", Evidence: 34, Verified: true},
			{Name: "Cloud", Evidence: 21, Verified: true},
		},
		ActiveSince:    activeSince,
		LastActivityAt: now.AddDate(0, 0, -12),
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	score := service.ComputeTrustScore(&profile)
	profile.TrustScore = score
	profile.TrustScore.Overall = target
	profile.TrustScore.Delta = 3.2
	return profile
}
