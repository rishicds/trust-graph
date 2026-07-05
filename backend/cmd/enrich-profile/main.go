package main

import (
	"context"
	"flag"
	"log"
	"time"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/database"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/enrichment"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
	"github.com/trustgraph/backend/internal/service/profilesync"
)

func main() {
	handle := flag.String("handle", "", "Profile handle to enrich (required)")
	flag.Parse()
	if *handle == "" && flag.NArg() > 0 {
		*handle = flag.Arg(0)
	}
	if *handle == "" {
		log.Fatal("usage: go run ./cmd/enrich-profile [-handle] rishicds")
	}

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
	profile, err := store.FindProfileByHandle(ctx, *handle)
	if err != nil {
		log.Fatal(err)
	}

	agent := enrichment.NewAgent(
		enrichment.NewFirecrawlClient(cfg.FirecrawlAPIKey),
		enrichment.NewTavilyClient(cfg.TavilyAPIKey),
		enrichment.NewNVIDIAClient(cfg.NVIDIAAPIKey, cfg.NVIDIAModel),
		enrichment.NewGeminiClient(cfg.GeminiAPIKey, cfg.GeminiModel),
		githubsvc.NewClient(cfg.GitHubToken),
	)

	log.Printf("Capabilities: %+v", agent.Capabilities())
	result, err := agent.EnrichProfile(ctx, profile)
	if err != nil {
		log.Fatal(err)
	}

	profile.AIInsight = &result.Insight
	profile.EnrichedSources = result.EnrichedSources
	for _, item := range result.Evidence {
		profile.Evidence = append(profile.Evidence, item)
	}
	profilesync.FinalizeProfileMetrics(profile)

	if err := store.UpdateProfile(ctx, profile); err != nil {
		log.Fatal(err)
	}

	log.Printf("Enriched @%s — summary: %s", profile.Handle, result.Insight.Summary)
	log.Printf("Highlights: %v", result.Insight.Highlights)
	log.Printf("Sources scraped: %d", len(result.EnrichedSources))
}
