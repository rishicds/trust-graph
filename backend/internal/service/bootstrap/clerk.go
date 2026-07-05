package bootstrap

import (
	"context"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/clerkaccounts"
	"github.com/trustgraph/backend/internal/service/profilesync"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

type GitHubFetcher interface {
	FetchStats(ctx context.Context, username string) (*githubsvc.Stats, error)
}

type Result struct {
	Profile      *models.Profile
	ShadowHandle string
}

func EnrichFromClerk(ctx context.Context, store *repository.Store, github GitHubFetcher, profile *models.Profile, clerkUser *clerk.User) (*Result, error) {
	if profile == nil {
		return nil, nil
	}

	result := &Result{Profile: profile}
	accounts := clerkaccounts.Parse(clerkUser)

	if accounts.GitHubUsername != "" && !hasSource(profile, "github") {
		if stats, err := github.FetchStats(ctx, accounts.GitHubUsername); err == nil {
			profilesync.ApplyGitHub(profile, stats, true)
		}
		if shadow, err := store.FindProfileByHandle(ctx, strings.ToLower(accounts.GitHubUsername)); err == nil && shadow.IsShadow && !shadow.IsClaimed {
			result.ShadowHandle = shadow.Handle
		}
	}

	if accounts.LinkedInUsername != "" && !hasSource(profile, "linkedin") {
		profilesync.ApplyLinkedIn(profile, accounts.LinkedInUsername, accounts.LinkedInName)
	}

	profilesync.FinalizeProfileMetrics(profile)
	if len(profile.Evidence) > 0 && profile.OnboardingStep < 2 {
		profile.OnboardingStep = 2
	}

	if err := store.UpdateProfile(ctx, profile); err != nil {
		return nil, err
	}
	return result, nil
}

func hasSource(profile *models.Profile, platform string) bool {
	for _, s := range profile.DataSources {
		if s.Platform == platform && s.Connected {
			return true
		}
	}
	return false
}
