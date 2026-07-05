package main

import (
	"bufio"
	"context"
	"flag"
	"log"
	"os"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/database"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/seed"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

func main() {
	gitstar := flag.Bool("gitstar", false, "Fetch usernames from gitstar-ranking.com/users")
	pages := flag.Int("pages", 1, "Gitstar-ranking pages to fetch (100 users per page, max 100)")
	fetchOnly := flag.Bool("fetch-only", false, "Only fetch gitstar usernames to file; do not seed MongoDB")
	out := flag.String("out", "", "Output file (default: SHADOW_GITHUB_FILE or data/shadow_github_users.txt)")
	refresh := flag.Bool("refresh", false, "Re-fetch GitHub data for existing shadow profiles (avatars, evidence, scores)")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	outFile := *out
	if outFile == "" {
		outFile = os.Getenv("SHADOW_GITHUB_FILE")
		if outFile == "" {
			outFile = "data/shadow_github_users.txt"
		}
	}

	var usernames []string

	if *gitstar {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()

		log.Printf("Fetching up to %d page(s) from https://gitstar-ranking.com/users …", *pages)
		usernames, err = seed.FetchGitstarUsernames(ctx, *pages)
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("Fetched %d unique usernames from gitstar-ranking", len(usernames))

		content := seed.FormatUsernameList(usernames, "gitstar-ranking.com/users", *pages)
		if err := os.WriteFile(outFile, []byte(content), 0o644); err != nil {
			log.Fatal(err)
		}
		log.Printf("Wrote %s", outFile)

		if *fetchOnly {
			return
		}
	} else {
		file := outFile
		if flag.NArg() > 0 {
			file = flag.Arg(0)
		}
		usernames, err = readUsernames(file)
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("Loaded %d usernames from %s", len(usernames), file)
	}

	if *fetchOnly {
		return
	}

	if cfg.GitHubToken == "" {
		log.Fatal("GITHUB_TOKEN is required for batch shadow ingest")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 6*time.Hour)
	defer cancel()

	client, err := database.Connect(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	store := repository.NewStore(client.Database(cfg.MongoDatabase))
	gh := githubsvc.NewClient(cfg.GitHubToken)
	result := seed.BatchGitHubShadows(ctx, store, gh, usernames, *refresh)
	log.Printf("Done: created=%d updated=%d skipped=%d failed=%d", result.Created, result.Updated, result.Skipped, result.Failed)
}

func readUsernames(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var out []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		out = append(out, strings.ToLower(line))
	}
	return out, scanner.Err()
}
