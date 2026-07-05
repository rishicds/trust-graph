package handlers

import (
	"context"
	"math"

	"github.com/trustgraph/backend/internal/models"
)

func (a *API) recordScoreChange(ctx context.Context, profile *models.Profile, previous float64) {
	if profile.TrustScore.Overall == previous {
		return
	}
	profile.TrustScore.Delta = profile.TrustScore.Overall - previous
	_ = a.store.SaveScoreSnapshot(ctx, profile.ID, profile.TrustScore)
	if math.Abs(profile.TrustScore.Delta) >= 5 && profile.WebhookURL != "" {
		_ = a.store.DispatchWebhook(ctx, profile)
	}
}
