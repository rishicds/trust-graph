package main

import (
	"context"
	"flag"
	"log"
	"time"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/database"
	"github.com/trustgraph/backend/internal/repository"
)

func main() {
	handle := flag.String("handle", "", "Profile handle (required)")
	overall := flag.Float64("overall", -1, "Overall trust score (optional)")
	peer := flag.Float64("peer", -1, "Peer verification dimension (optional)")
	flag.Parse()

	if *handle == "" {
		log.Fatal("usage: go run ./cmd/set-score -handle rishicds [-overall 95] [-peer 80]")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client, err := database.Connect(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	store := repository.NewStore(client.Database(cfg.MongoDatabase))
	profile, err := store.FindProfileByHandle(ctx, *handle)
	if err != nil {
		log.Fatal(err)
	}

	previousOverall := profile.TrustScore.Overall
	previousPeer := profile.TrustScore.Dimensions.PeerVerification

	if *overall >= 0 {
		profile.TrustScore.Overall = *overall
	}
	if *peer >= 0 {
		profile.TrustScore.Dimensions.PeerVerification = *peer
	}
	profile.ScoreOverride = true
	profile.TrustScore.UpdatedAt = time.Now().UTC()

	if err := store.UpdateProfile(ctx, profile); err != nil {
		log.Fatal(err)
	}

	saved, err := store.FindProfileByHandle(ctx, *handle)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf(
		"@%s: overall %.1f -> %.1f, peer %.1f -> %.1f",
		profile.Handle,
		previousOverall,
		profile.TrustScore.Overall,
		previousPeer,
		profile.TrustScore.Dimensions.PeerVerification,
	)
	log.Printf("score_override persisted: %v (saved overall %.1f peer %.1f)", saved.ScoreOverride, saved.TrustScore.Overall, saved.TrustScore.Dimensions.PeerVerification)
}
