package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/avatars"
)

func (a *API) requireRecruiter(w http.ResponseWriter, r *http.Request) (models.User, bool) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return models.User{}, false
	}
	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return models.User{}, false
	}
	if user.AccountType != "recruiter" || !user.RecruiterOnboardingComplete {
		writeError(w, http.StatusForbidden, "recruiter onboarding incomplete")
		return models.User{}, false
	}
	return *user, true
}

func (a *API) ListRecruiterSavedCandidates(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRecruiter(w, r)
	if !ok {
		return
	}

	saved, err := a.store.ListRecruiterSavedCandidates(r.Context(), user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load saved candidates")
		return
	}

	views := make([]models.RecruiterSavedCandidateView, 0, len(saved))
	for _, item := range saved {
		profile, err := a.store.FindProfileByHandle(r.Context(), item.ProfileHandle)
		if err != nil {
			continue
		}
		views = append(views, models.RecruiterSavedCandidateView{
			Handle:         profile.Handle,
			DisplayName:    profile.DisplayName,
			Headline:       profile.Headline,
			AvatarURL:      avatars.Resolve(profile.Handle, profile.AvatarURL),
			TrustScore:     profile.TrustScore.Overall,
			EvidenceCount:  len(profile.Evidence),
			Notes:          item.Notes,
			SavedFromQuery: item.SavedFromQuery,
			SavedAt:        item.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		})
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"saved": views,
		"total": len(views),
	})
}

func (a *API) SaveRecruiterCandidate(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRecruiter(w, r)
	if !ok {
		return
	}

	var req struct {
		Handle         string `json:"handle"`
		Notes          string `json:"notes"`
		SavedFromQuery string `json:"saved_from_query"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	handle := strings.TrimSpace(strings.ToLower(req.Handle))
	if handle == "" {
		writeError(w, http.StatusBadRequest, "handle required")
		return
	}

	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	if err := a.store.SaveRecruiterCandidate(r.Context(), user.ID, profile.ID, handle, strings.TrimSpace(req.Notes), strings.TrimSpace(req.SavedFromQuery)); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save candidate")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"handle":  handle,
		"starred": true,
	})
}

func (a *API) RemoveRecruiterSavedCandidate(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRecruiter(w, r)
	if !ok {
		return
	}

	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	if handle == "" {
		writeError(w, http.StatusBadRequest, "handle required")
		return
	}

	if err := a.store.RemoveRecruiterSavedCandidate(r.Context(), user.ID, handle); err != nil {
		if err == repository.ErrNotFound {
			writeError(w, http.StatusNotFound, "saved candidate not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not remove saved candidate")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"handle":  handle,
		"starred": false,
	})
}
