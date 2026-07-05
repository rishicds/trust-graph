package handlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/profilesync"
)

func (a *API) EnrichmentCapabilities(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"capabilities": a.enrichment.Capabilities(),
	})
}

func (a *API) RefreshProfileInsights(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	result, err := a.enrichment.EnrichProfile(r.Context(), profile)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	previous := profile.TrustScore.Overall
	profile.AIInsight = &result.Insight
	profile.EnrichedSources = result.EnrichedSources
	for _, item := range result.Evidence {
		if !hasEvidenceTitle(profile.Evidence, item.Title, item.Platform) {
			profile.Evidence = append(profile.Evidence, item)
		}
	}
	profilesync.FinalizeProfileMetrics(profile)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save insights")
		return
	}
	a.recordScoreChange(r.Context(), profile, previous)

	writeJSON(w, http.StatusOK, profile)
}

func (a *API) GetProfileInsights(w http.ResponseWriter, r *http.Request) {
	handle := r.PathValue("handle")
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}
	if profile.AIInsight == nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"handle":       handle,
			"ai_insight":   nil,
			"capabilities": a.enrichment.Capabilities(),
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"handle":           handle,
		"ai_insight":       profile.AIInsight,
		"enriched_sources": profile.EnrichedSources,
		"capabilities":     a.enrichment.Capabilities(),
	})
}

func hasEvidenceTitle(items []models.EvidenceItem, title, platform string) bool {
	for _, item := range items {
		if item.Platform == platform && strings.EqualFold(item.Title, title) {
			return true
		}
	}
	return false
}

func (a *API) applySupplementalEvidence(ctx context.Context, profile *models.Profile) {
	if profile == nil {
		return
	}
	items, err := a.enrichment.SupplementSparseEvidence(ctx, profile)
	if err != nil || len(items) == 0 {
		return
	}
	changed := false
	for _, item := range items {
		if hasEvidenceTitle(profile.Evidence, item.Title, item.Platform) {
			continue
		}
		profile.Evidence = append(profile.Evidence, item)
		changed = true
	}
	if !changed {
		return
	}
	profilesync.RecomputeScore(profile)
	profilesync.FinalizeProfileMetrics(profile)
}
