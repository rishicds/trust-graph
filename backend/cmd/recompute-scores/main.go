package main

import (
	"context"
	"log"
	"time"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/database"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/profilesync"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	client, err := database.Connect(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	store := repository.NewStore(client.Database(cfg.MongoDatabase))
	profiles, err := store.ListProfiles(ctx, 1000)
	if err != nil {
		log.Fatal(err)
	}

	updated := 0
	for i := range profiles {
		if len(profiles[i].Evidence) == 0 {
			continue
		}
		previous := profiles[i].TrustScore.Overall
		profilesync.RecomputeScore(&profiles[i])
		if profiles[i].TrustScore.Overall == previous {
			continue
		}
		if err := store.UpdateProfile(ctx, &profiles[i]); err != nil {
			log.Printf("update %s: %v", profiles[i].Handle, err)
			continue
		}
		log.Printf("%s: %.1f -> %.1f", profiles[i].Handle, previous, profiles[i].TrustScore.Overall)
		updated++
	}
	log.Printf("Recomputed %d profile(s)", updated)
}
