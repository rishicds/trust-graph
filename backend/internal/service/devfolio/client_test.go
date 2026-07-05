package devfolio

import (
	"context"
	"os"
	"testing"

	"github.com/joho/godotenv"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
	"github.com/trustgraph/backend/internal/service/enrichment"
)

func TestNormalizeProfileURL(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"rishi04", "https://devfolio.co/@rishi04"},
		{"@rishi04", "https://devfolio.co/@rishi04"},
		{"devfolio.co/@rishi04", "https://devfolio.co/@rishi04"},
		{"https://devfolio.co/@rishi04/", "https://devfolio.co/@rishi04"},
	}
	for _, tc := range tests {
		got, err := NormalizeProfileURL(tc.in)
		if err != nil {
			t.Fatalf("NormalizeProfileURL(%q): %v", tc.in, err)
		}
		if got != tc.want {
			t.Fatalf("NormalizeProfileURL(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestFetchProfileIntegration(t *testing.T) {
	_ = godotenv.Load("../../../.env")
	_ = godotenv.Load(".env")

	if os.Getenv("FIRECRAWL_API_KEY") == "" {
		t.Skip("FIRECRAWL_API_KEY not set")
	}
	if os.Getenv("GEMINI_API_KEY") == "" && os.Getenv("NVIDIA_AI_API") == "" {
		t.Skip("GEMINI_API_KEY or NVIDIA_AI_API required")
	}

	agent := enrichment.NewAgent(
		enrichment.NewFirecrawlClient(os.Getenv("FIRECRAWL_API_KEY")),
		enrichment.NewTavilyClient(os.Getenv("TAVILY_API_KEY")),
		enrichment.NewNVIDIAClient(os.Getenv("NVIDIA_AI_API"), os.Getenv("NVIDIA_AI_MODEL")),
		enrichment.NewGeminiClient(os.Getenv("GEMINI_API_KEY"), os.Getenv("GEMINI_MODEL")),
		githubsvc.NewClient(os.Getenv("GITHUB_TOKEN")),
	)

	client := NewClient(agent)
	stats, err := client.FetchProfile(context.Background(), "@rishi04")
	if err != nil {
		t.Fatalf("FetchProfile: %v", err)
	}
	if stats.Username == "" {
		t.Fatal("expected username in stats")
	}
	t.Logf("username=%s wins=%d hackathons=%d projects=%d",
		stats.Username, stats.TotalWins, len(stats.Hackathons), len(stats.Projects))
}
