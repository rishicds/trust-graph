package seed

import (
	"context"
	"os"
	"strings"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/profilesync"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

func Profiles(ctx context.Context, store *repository.Store, cfg *config.Config) error {
	if err := DemoProfiles(ctx, store); err != nil {
		return err
	}
	return GitHubShadows(ctx, store, cfg)
}

func GitHubShadows(ctx context.Context, store *repository.Store, cfg *config.Config) error {
	raw := os.Getenv("SHADOW_GITHUB_USERS")
	if raw == "" {
		raw = "torvalds,gaearon,tj"
	}

	client := githubsvc.NewClient(cfg.GitHubToken)
	for _, username := range strings.Split(raw, ",") {
		username = strings.TrimSpace(strings.ToLower(username))
		if username == "" {
			continue
		}

		handle := username
		if existing, err := store.FindProfileByHandle(ctx, handle); err == nil && existing != nil {
			continue
		}

		stats, err := client.FetchStats(ctx, username)
		if err != nil {
			continue
		}

		profile := profilesync.BuildShadowProfile(handle, stats)
		if err := store.CreateProfile(ctx, profile); err != nil {
			continue
		}
	}
	return nil
}
