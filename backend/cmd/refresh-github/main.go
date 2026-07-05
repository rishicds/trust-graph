package main

import (
	"context"
	"log"
	"time"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/database"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/profilesync"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	if cfg.GitHubToken == "" {
		log.Fatal("GITHUB_TOKEN required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	client, err := database.Connect(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	store := repository.NewStore(client.Database(cfg.MongoDatabase))
	gh := githubsvc.NewClient(cfg.GitHubToken)

	profiles, err := store.ListConnectedProfiles(ctx, "github")
	if err != nil {
		log.Fatal(err)
	}

	for i := range profiles {
		source := findSource(profiles[i].DataSources, "github")
		if source == nil || source.ExternalID == "" {
			continue
		}
		stats, err := gh.FetchStats(ctx, source.ExternalID)
		if err != nil {
			log.Printf("%s: fetch failed: %v", profiles[i].Handle, err)
			continue
		}
		previous := profiles[i].TrustScore.Overall
		profilesync.ApplyGitHub(&profiles[i], stats, true)
		if err := store.UpdateProfile(ctx, &profiles[i]); err != nil {
			log.Printf("%s: update failed: %v", profiles[i].Handle, err)
			continue
		}
		log.Printf("%s: %.1f -> %.1f (github=%s)", profiles[i].Handle, previous, profiles[i].TrustScore.Overall, source.ExternalID)
	}
}

func findSource(sources []models.DataSource, platform string) *models.DataSource {
	for i := range sources {
		if sources[i].Platform == platform && sources[i].Connected {
			return &sources[i]
		}
	}
	return nil
}
