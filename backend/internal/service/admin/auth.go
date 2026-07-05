package admin

import (
	"context"
	"strings"

	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/clerkaccounts"
)

// GitHubUsername returns the GitHub login for a Clerk user, if connected.
func GitHubUsername(ctx context.Context, clerkID string) (string, error) {
	clerkUser, err := clerkuser.Get(ctx, clerkID)
	if err != nil {
		return "", err
	}
	return strings.ToLower(strings.TrimSpace(clerkaccounts.Parse(clerkUser).GitHubUsername)), nil
}

// IsAuthorized checks Clerk GitHub username, linked profile, and admin email allowlist.
func IsAuthorized(ctx context.Context, cfg *config.Config, store *repository.Store, clerkID string) (bool, string, error) {
	clerkUser, err := clerkuser.Get(ctx, clerkID)
	if err != nil {
		return false, "", err
	}

	for _, ea := range clerkUser.EmailAddresses {
		if cfg.IsAdminEmail(ea.EmailAddress) {
			return true, strings.ToLower(strings.TrimSpace(ea.EmailAddress)), nil
		}
	}

	accounts := clerkaccounts.Parse(clerkUser)
	if accounts.GitHubUsername != "" && cfg.IsAdminGitHub(accounts.GitHubUsername) {
		return true, strings.ToLower(accounts.GitHubUsername), nil
	}

	user, err := store.FindUserByClerkID(ctx, clerkID)
	if err == nil && cfg.IsAdminEmail(user.Email) {
		return true, strings.ToLower(strings.TrimSpace(user.Email)), nil
	}
	if err != nil && err != repository.ErrNotFound {
		return false, accounts.GitHubUsername, err
	}
	if err != nil {
		return false, accounts.GitHubUsername, nil
	}

	profile, err := store.FindProfileByUserID(ctx, user.ID)
	if err != nil {
		return false, accounts.GitHubUsername, nil
	}

	if cfg.IsAdminGitHub(profile.Handle) {
		return true, profile.Handle, nil
	}

	for _, src := range profile.DataSources {
		if src.Platform == "github" && src.Connected && cfg.IsAdminGitHub(src.ExternalID) {
			return true, strings.ToLower(src.ExternalID), nil
		}
	}

	return false, accounts.GitHubUsername, nil
}
