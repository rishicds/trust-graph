package main

import (
	"context"
	"flag"
	"log"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/database"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/enrichment"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
	"github.com/trustgraph/backend/internal/service/profilesync"
)

var defaultFeaturedHandles = []string{
	"rishicds",
	"pragya79645",
	"rajarshi44",
	"debayudh07",
	"0m4nu4l",
	"neutral-ronnie",
}

func main() {
	handlesFlag := flag.String("handles", "", "Comma-separated profile handles (default: landing featured list)")
	skipEnrich := flag.Bool("skip-enrich", false, "Skip AI enrichment pass")
	flag.Parse()

	handles := defaultFeaturedHandles
	if strings.TrimSpace(*handlesFlag) != "" {
		parts := strings.Split(*handlesFlag, ",")
		handles = make([]string, 0, len(parts))
		for _, p := range parts {
			h := strings.ToLower(strings.TrimSpace(p))
			if h != "" {
				handles = append(handles, h)
			}
		}
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	if cfg.GitHubToken == "" {
		log.Fatal("GITHUB_TOKEN required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	client, err := database.Connect(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	store := repository.NewStore(client.Database(cfg.MongoDatabase))
	gh := githubsvc.NewClient(cfg.GitHubToken)

	var agent *enrichment.Agent
	if !*skipEnrich && cfg.EnrichmentEnabled() {
		agent = enrichment.NewAgent(
			enrichment.NewFirecrawlClient(cfg.FirecrawlAPIKey),
			enrichment.NewTavilyClient(cfg.TavilyAPIKey),
			enrichment.NewNVIDIAClient(cfg.NVIDIAAPIKey, cfg.NVIDIAModel),
			enrichment.NewGeminiClient(cfg.GeminiAPIKey, cfg.GeminiModel),
			gh,
		)
	}

	for _, handle := range handles {
		if err := rescrape(ctx, store, gh, agent, handle); err != nil {
			log.Printf("@%s: FAILED: %v", handle, err)
			continue
		}
		log.Printf("@%s: rescrape complete", handle)
	}
}

func rescrape(
	ctx context.Context,
	store *repository.Store,
	gh *githubsvc.Client,
	agent *enrichment.Agent,
	handle string,
) error {
	profile, err := store.FindProfileByHandle(ctx, handle)
	if err != nil {
		return err
	}

	ghLogin := githubLoginFromProfile(profile)
	if ghLogin == "" {
		ghLogin = handle
	}

	stats, err := gh.FetchStats(ctx, ghLogin)
	if err != nil {
		return err
	}

	previous := profile.TrustScore.Overall
	profilesync.ApplyGitHub(profile, stats, true)

	if agent != nil {
		result, err := agent.EnrichProfile(ctx, profile)
		if err != nil {
			log.Printf("@%s: enrichment warning: %v", handle, err)
		} else if result != nil {
			profile.AIInsight = &result.Insight
			profile.EnrichedSources = result.EnrichedSources
			for _, item := range result.Evidence {
				if !hasEvidenceTitle(profile.Evidence, item.Title, item.Platform) {
					profile.Evidence = append(profile.Evidence, item)
				}
			}
		}
	}

	profilesync.FinalizeProfileMetrics(profile)
	profilesync.RecomputeScore(profile)

	if err := store.UpdateProfile(ctx, profile); err != nil {
		return err
	}

	log.Printf("@%s: score %.1f -> %.1f, evidence=%d, capabilities=%d",
		handle, previous, profile.TrustScore.Overall, len(profile.Evidence), len(profile.Capabilities))
	return nil
}

func githubLoginFromProfile(profile *models.Profile) string {
	if profile == nil {
		return ""
	}
	for _, src := range profile.DataSources {
		if src.Platform == "github" && src.Connected && src.ExternalID != "" {
			return strings.ToLower(strings.TrimSpace(src.ExternalID))
		}
	}
	if profile.IsShadow {
		return strings.ToLower(strings.TrimSpace(profile.Handle))
	}
	return ""
}

func hasEvidenceTitle(items []models.EvidenceItem, title, platform string) bool {
	for _, item := range items {
		if item.Title == title && item.Platform == platform {
			return true
		}
	}
	return false
}
