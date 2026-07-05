package seed

import (
	"context"
	"log"
	"time"

	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/profilesync"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

type BatchResult struct {
	Created int
	Updated int
	Skipped int
	Failed  int
}

func BatchGitHubShadows(ctx context.Context, store *repository.Store, client *githubsvc.Client, usernames []string, refresh bool) BatchResult {
	result := BatchResult{}
	for _, username := range usernames {
		if username == "" {
			continue
		}

		existing, findErr := store.FindProfileByHandle(ctx, username)
		if findErr == nil && existing != nil && !refresh {
			result.Skipped++
			continue
		}

		stats, err := client.FetchStats(ctx, username)
		if err != nil {
			result.Failed++
			log.Printf("shadow batch: %s fetch failed: %v", username, err)
			time.Sleep(2 * time.Second)
			continue
		}

		if existing != nil {
			profilesync.ApplyGitHub(existing, stats, true)
			if err := store.UpdateProfile(ctx, existing); err != nil {
				result.Failed++
				log.Printf("shadow batch: %s update failed: %v", username, err)
				continue
			}
			result.Updated++
		} else {
			profile := profilesync.BuildShadowProfile(username, stats)
			if err := store.UpsertProfileByHandle(ctx, profile); err != nil {
				result.Failed++
				log.Printf("shadow batch: %s upsert failed: %v", username, err)
				continue
			}
			result.Created++
		}

		time.Sleep(1500 * time.Millisecond)
	}
	return result
}
