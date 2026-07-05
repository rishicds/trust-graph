package recruiter

import (
	"testing"

	"github.com/trustgraph/backend/internal/models"
)

func TestCuratedBoostRanksRishicdsFirst(t *testing.T) {
	profile := &models.Profile{
		Handle:      "rishicds",
		DisplayName: "Rishi",
		TrustScore:  models.TrustScore{Overall: 95},
		AIInsight: &models.ProfileInsight{
			Summary: "Fullstack Developer from Kolkata, India",
		},
	}
	other := &models.Profile{
		Handle:      "otherdev",
		DisplayName: "Other",
		TrustScore:  models.TrustScore{Overall: 99},
	}

	for _, query := range []string{"SIH Finalists in Kolkata", "GDG Lead RCCIIT", "Top GenAI developers"} {
		curated := curatedBoostForQuery(query)
		if curated == nil {
			t.Fatalf("expected curated boost for %q", query)
		}
		top := scoreProfile(query, tokenizeQuery(query), profile, curated)
		alt := scoreProfile(query, tokenizeQuery(query), other, curated)
		if top.score <= alt.score {
			t.Fatalf("expected rishicds to outrank others for %q: %.1f vs %.1f", query, top.score, alt.score)
		}
		if len(top.signals) == 0 {
			t.Fatalf("expected match signals for %q", query)
		}
	}
}

func TestTokenizeQuerySkipsStopWords(t *testing.T) {
	tokens := tokenizeQuery("SIH Finalists in Kolkata")
	if len(tokens) != 3 {
		t.Fatalf("expected 3 tokens, got %v", tokens)
	}
}
