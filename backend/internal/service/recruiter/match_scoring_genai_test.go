package recruiter

import (
	"testing"

	"github.com/trustgraph/backend/internal/models"
)

func TestGenAIThemeBoostsOtherDevelopers(t *testing.T) {
	query := "Top GenAI developers"
	curated := curatedBoostForQuery(query)
	if curated == nil {
		t.Fatal("expected curated boost")
	}

	rishi := scoreProfile(query, expandSearchTokens(query, tokenizeQuery(query)), &models.Profile{
		Handle:     "rishicds",
		TrustScore: models.TrustScore{Overall: 95},
	}, curated)

	peer := scoreProfile(query, expandSearchTokens(query, tokenizeQuery(query)), &models.Profile{
		Handle:      "pragya79645",
		TrustScore:  models.TrustScore{Overall: 80},
		AIInsight: &models.ProfileInsight{
			Summary:     "Aspiring frontend developer and AI/ML enthusiast",
			RoleSignals: []string{"Frontend Developer", "AI/ML Enthusiast"},
		},
	}, curated)

	if rishi.score <= peer.score {
		t.Fatalf("expected rishicds first: %.1f vs %.1f", rishi.score, peer.score)
	}
	if peer.score < 60 {
		t.Fatalf("expected peer developer to receive genai theme boost, got %.1f", peer.score)
	}
}

func TestExpandSearchTokensForGenAI(t *testing.T) {
	tokens := expandSearchTokens("Top GenAI developers", tokenizeQuery("Top GenAI developers"))
	found := map[string]bool{}
	for _, tok := range tokens {
		found[tok] = true
	}
	for _, want := range []string{"genai", "ai", "ml", "machine", "learning"} {
		if !found[want] {
			t.Fatalf("expected token %q in %v", want, tokens)
		}
	}
}
