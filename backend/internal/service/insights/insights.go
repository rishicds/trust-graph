package insights

import (
	"context"
	"fmt"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
)

func BuildComparative(ctx context.Context, store *repository.Store, profile *models.Profile) []models.ComparativeInsight {
	dims := []struct {
		key   string
		label string
		value float64
	}{
		{"overall", "Overall trust score", profile.TrustScore.Overall},
		{"evidence_depth", "Evidence depth", profile.TrustScore.Dimensions.EvidenceDepth},
		{"consistency", "Consistency", profile.TrustScore.Dimensions.Consistency},
		{"peer_verification", "Peer verification", profile.TrustScore.Dimensions.PeerVerification},
		{"impact_signals", "Impact signals", profile.TrustScore.Dimensions.ImpactSignals},
		{"trust_ratio", "Trust ratio", profile.TrustScore.Dimensions.TrustRatio},
	}

	out := make([]models.ComparativeInsight, 0, len(dims))
	for _, d := range dims {
		pct, err := store.ScorePercentile(ctx, d.key, d.value)
		if err != nil {
			pct = 50
		}
		out = append(out, models.ComparativeInsight{
			Dimension:  d.label,
			Percentile: pct,
			Message:    fmt.Sprintf("Top %.0f%% of TrustGraph profiles for %s", 100-pct, d.label),
		})
	}
	return out
}
