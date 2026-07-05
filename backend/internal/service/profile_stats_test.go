package service

import (
	"testing"
	"time"

	"github.com/trustgraph/backend/internal/models"
)

func TestEvidenceToStatLowNumbersUseConcreteLabels(t *testing.T) {
	now := time.Now()
	evidence := []models.EvidenceItem{
		{Type: "community_reach", Title: "GitHub followers", Platform: "github", Count: 9, OccurredAt: now},
		{Type: "open_source_impact", Title: "GitHub repository stars", Platform: "github", Count: 5, OccurredAt: now},
		{Type: "flagship_project", Title: "Flagship repo: ankur-bag", Platform: "github", Count: 1, OccurredAt: now},
		{Type: "merged_pr", Title: "Merged pull requests on GitHub", Platform: "github", Count: 32, OccurredAt: now},
	}

	stats := BuildProfileStats(evidence)
	byLabel := map[string]ProfileStat{}
	for _, s := range stats {
		byLabel[s.Label] = s
	}

	if stat, ok := byLabel["GitHub followers"]; !ok || stat.Display != "9" {
		t.Fatalf("followers stat: %+v", byLabel)
	}
	if stat, ok := byLabel["Stars on public repos"]; !ok || stat.Display != "5" {
		t.Fatalf("stars stat: %+v", byLabel)
	}
	if stat, ok := byLabel["Flagship project · ankur-bag"]; !ok || stat.Display != "ankur-bag" {
		t.Fatalf("flagship stat: got display %q", stat.Display)
	}
	if stat, ok := byLabel["PRs merged (public)"]; !ok || stat.Display != "32" {
		t.Fatalf("pr stat: %+v", byLabel)
	}
}

func TestPreferPortfolioFlagship(t *testing.T) {
	now := time.Now()
	evidence := []models.EvidenceItem{
		{Type: "flagship_project", Title: "Flagship repo: tiny", Platform: "github", Count: 1, OccurredAt: now},
		{Type: "flagship_project", Title: "Flagship project: Payments platform", Platform: "portfolio", Count: 1, OccurredAt: now},
	}
	stats := BuildProfileStats(evidence)
	for _, s := range stats {
		if s.Label == "Flagship project · tiny" || s.Display == "tiny" {
			t.Fatalf("expected weak github flagship to be hidden, got %+v", s)
		}
	}
}
