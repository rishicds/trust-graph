package handlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (a *API) recruiterUnlimited(ctx context.Context, userID primitive.ObjectID) bool {
	user, err := a.store.FindUserByID(ctx, userID)
	if err != nil {
		return false
	}
	return a.cfg.IsRecruiterUnlimitedEmail(user.Email)
}

func (a *API) RecruiterEligibility(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	isOwner := profile.UserID == userID
	unlimited := a.recruiterUnlimited(r.Context(), userID)
	eligibility, err := a.store.RecruiterEligibility(r.Context(), userID, profile.ID, isOwner, unlimited)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not check eligibility")
		return
	}

	if active, _ := a.store.ActiveRecruiterRunForProfile(r.Context(), profile.ID); active != nil {
		if active.RequesterUserID == userID {
			eligibility.LastRunStatus = active.Status
			eligibility.ActiveRunID = active.ID.Hex()
			eligibility.Eligible = false
			eligibility.Reason = "Your recruiter deep search is running in the background"
		} else if eligibility.Eligible {
			eligibility.Eligible = false
			eligibility.Reason = "A recruiter deep search is already in progress for this profile"
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"handle":       handle,
		"eligibility":  eligibility,
		"capabilities": a.enrichment.Capabilities(),
	})
}

func (a *API) StartRecruiterSearch(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	isOwner := profile.UserID == userID
	unlimited := a.recruiterUnlimited(r.Context(), userID)
	eligibility, err := a.store.RecruiterEligibility(r.Context(), userID, profile.ID, isOwner, unlimited)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not check eligibility")
		return
	}
	if !eligibility.Eligible {
		writeJSON(w, http.StatusTooManyRequests, map[string]interface{}{
			"error":       eligibility.Reason,
			"eligibility": eligibility,
		})
		return
	}

	if active, _ := a.store.ActiveRecruiterRunForProfile(r.Context(), profile.ID); active != nil {
		writeJSON(w, http.StatusConflict, map[string]interface{}{
			"error":  "recruiter search already in progress",
			"run_id": active.ID.Hex(),
			"status": active.Status,
		})
		return
	}

	run := &models.RecruiterSearchRun{
		ProfileID:       profile.ID,
		ProfileHandle:   profile.Handle,
		RequesterUserID: userID,
		Status:          models.RecruiterRunQueued,
		ScoreBefore:     profile.TrustScore.Overall,
	}
	if err := a.store.CreateRecruiterRun(r.Context(), run); err != nil {
		writeError(w, http.StatusInternalServerError, "could not start recruiter search")
		return
	}

	a.recruiterWorker.Enqueue(run.ID)

	writeJSON(w, http.StatusAccepted, map[string]interface{}{
		"run_id":  run.ID.Hex(),
		"status":  run.Status,
		"handle":  handle,
		"message": "Recruiter deep search queued — runs in the background; you can close this page",
	})
}

func (a *API) GetRecruiterRun(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	runID, err := primitive.ObjectIDFromHex(r.PathValue("runId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid run id")
		return
	}

	run, err := a.store.FindRecruiterRunByID(r.Context(), runID)
	if err != nil {
		writeError(w, http.StatusNotFound, "run not found")
		return
	}
	if run.RequesterUserID != userID {
		writeError(w, http.StatusForbidden, "forbidden")
		return
	}

	payload := map[string]interface{}{
		"run": run,
	}
	if run.Status == models.RecruiterRunCompleted {
		profile, err := a.store.FindProfileByHandle(r.Context(), run.ProfileHandle)
		if err == nil && profile.RecruiterReport != nil {
			payload["report"] = profile.RecruiterReport
			payload["trust_score"] = profile.TrustScore
		}
	}

	writeJSON(w, http.StatusOK, payload)
}
