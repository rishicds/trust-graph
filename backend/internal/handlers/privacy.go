package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	devfoliosvc "github.com/trustgraph/backend/internal/service/devfolio"
	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/profilesync"
)

func (a *API) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		IsPrivate         *bool  `json:"is_private"`
		PublicBreakdown   *bool  `json:"public_breakdown"`
		WebhookURL        string `json:"webhook_url"`
		EmailDigestEnabled *bool `json:"email_digest_enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	if req.IsPrivate != nil {
		profile.IsPrivate = *req.IsPrivate
	}
	if req.PublicBreakdown != nil {
		profile.PublicBreakdown = *req.PublicBreakdown
	}
	if req.WebhookURL != "" || r.Method != "" {
		profile.WebhookURL = strings.TrimSpace(req.WebhookURL)
	}
	if err := a.store.UpdateProfileSettings(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update settings")
		return
	}

	if req.EmailDigestEnabled != nil {
		_ = a.store.UpdateUserSettings(r.Context(), userID, *req.EmailDigestEnabled)
	}

	writeJSON(w, http.StatusOK, profile)
}

func (a *API) DisconnectSource(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	platform := strings.TrimSpace(strings.ToLower(r.PathValue("platform")))
	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	preview := profile.TrustScore.Overall
	filteredSources := make([]models.DataSource, 0, len(profile.DataSources))
	for _, s := range profile.DataSources {
		if s.Platform != platform {
			filteredSources = append(filteredSources, s)
		}
	}
	filteredEvidence := make([]models.EvidenceItem, 0, len(profile.Evidence))
	for _, e := range profile.Evidence {
		if e.Platform != platform {
			filteredEvidence = append(filteredEvidence, e)
		}
	}

	profile.DataSources = filteredSources
	profile.Evidence = filteredEvidence
	profilesync.RecomputeScore(profile)
	profilesync.FinalizeProfileMetrics(profile)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not disconnect source")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"profile":        profile,
		"previous_score": preview,
		"new_score":      profile.TrustScore.Overall,
		"score_delta":    profile.TrustScore.Overall - preview,
	})
}

func (a *API) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if err := a.store.DeleteUserAccount(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "could not delete account")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (a *API) ScoreHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if user.Plan != "pro" {
		writeError(w, http.StatusPaymentRequired, "pro plan required for score history")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	history, err := a.store.ListScoreHistory(r.Context(), profile.ID, 30)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load score history")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"history": history})
}

func (a *API) GenerateAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if user.Plan != "pro" {
		writeError(w, http.StatusPaymentRequired, "pro plan required for API keys")
		return
	}

	key, err := a.store.GenerateAPIKey(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not generate api key")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"api_key": key})
}

func (a *API) ConnectDevpost(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Username) == "" {
		writeError(w, http.StatusBadRequest, "devpost username is required")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	stats, err := a.devpost.FetchByUsername(r.Context(), req.Username)
	if err != nil {
		writeError(w, http.StatusBadRequest, "devpost user not found")
		return
	}

	previous := profile.TrustScore.Overall
	profilesync.ApplyDevpost(profile, stats)
	profilesync.FinalizeProfileMetrics(profile)
	_ = a.store.UpdateProfile(r.Context(), profile)
	a.recordScoreChange(r.Context(), profile, previous)
	if profile.TrustScore.Overall != previous {
		profile.TrustScore.Delta = profile.TrustScore.Overall - previous
	}
	writeJSON(w, http.StatusOK, profile)
}

func (a *API) ConnectDevfolio(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		ProfileURL string `json:"profile_url"`
		Username   string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	raw := strings.TrimSpace(req.ProfileURL)
	if raw == "" {
		raw = strings.TrimSpace(req.Username)
	}
	if raw == "" {
		writeError(w, http.StatusBadRequest, "devfolio profile url or username is required")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	profileURL, err := devfoliosvc.NormalizeProfileURL(raw)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	stats, err := a.devfolio.FetchProfile(r.Context(), profileURL)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	previous := profile.TrustScore.Overall
	profilesync.ApplyDevfolio(profile, stats)
	profilesync.FinalizeProfileMetrics(profile)
	_ = a.store.UpdateProfile(r.Context(), profile)
	a.recordScoreChange(r.Context(), profile, previous)
	if profile.TrustScore.Overall != previous {
		profile.TrustScore.Delta = profile.TrustScore.Overall - previous
	}
	writeJSON(w, http.StatusOK, profile)
}

func (a *API) AddManualClaim(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Type  string `json:"type"`
		Title string `json:"title"`
		URL   string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Title) == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	profilesync.ApplyManualClaim(profile, req.Type, req.Title, strings.TrimSpace(req.URL))
	profilesync.FinalizeProfileMetrics(profile)
	_ = a.store.UpdateProfile(r.Context(), profile)
	writeJSON(w, http.StatusOK, profile)
}
