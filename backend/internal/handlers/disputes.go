package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (a *API) CreateProfileDispute(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "sign in to file a dispute")
		return
	}

	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	if !profile.IsClaimed || profile.IsShadow {
		writeError(w, http.StatusBadRequest, "disputes can only be filed against claimed profiles")
		return
	}

	if profile.UserID == userID {
		writeError(w, http.StatusBadRequest, "you cannot dispute your own profile")
		return
	}

	var req struct {
		Reason  string `json:"reason"`
		Details string `json:"details"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Reason = strings.TrimSpace(req.Reason)
	req.Details = strings.TrimSpace(req.Details)
	if req.Reason == "" {
		writeError(w, http.StatusBadRequest, "reason is required")
		return
	}

	if existing, _ := a.store.FindOpenDisputeByReporter(r.Context(), profile.ID, userID); existing != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"dispute":  existing,
			"existing": true,
			"message":  "You already have an open dispute for this profile.",
		})
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "account not found")
		return
	}

	dispute := &models.ProfileDispute{
		ProfileID:      profile.ID,
		ProfileHandle:  profile.Handle,
		ReporterUserID: userID,
		ReporterEmail:  user.Email,
		ReporterName:   user.Name,
		Reason:         req.Reason,
		Details:        req.Details,
		Status:         models.DisputeStatusOpen,
	}
	if err := a.store.CreateDispute(r.Context(), dispute); err != nil {
		writeError(w, http.StatusInternalServerError, "could not file dispute")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"dispute": dispute,
		"message": "Dispute submitted. Our team will review it.",
	})
}

func (a *API) AdminListDisputes(w http.ResponseWriter, r *http.Request) {
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	if status == "" {
		status = "open"
	}
	limit := int64(queryInt(r, "limit", 50))
	skip := int64(queryInt(r, "offset", 0))
	if limit > 200 {
		limit = 200
	}

	rows, err := a.store.ListDisputesAdmin(r.Context(), status, limit, skip)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list disputes")
		return
	}

	openCount, _ := a.store.CountOpenDisputes(r.Context())
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"disputes":   rows,
		"open_count": openCount,
		"limit":      limit,
		"offset":     skip,
	})
}

func (a *API) AdminResolveDispute(w http.ResponseWriter, r *http.Request) {
	disputeID, err := primitive.ObjectIDFromHex(r.PathValue("disputeId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid dispute id")
		return
	}

	var body struct {
		Action    string `json:"action"`
		AdminNote string `json:"admin_note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	action := strings.ToLower(strings.TrimSpace(body.Action))
	if action != "dismiss" && action != "unclaim" {
		writeError(w, http.StatusBadRequest, "action must be dismiss or unclaim")
		return
	}

	dispute, err := a.store.FindDisputeByID(r.Context(), disputeID)
	if err != nil {
		writeError(w, http.StatusNotFound, "dispute not found")
		return
	}
	if dispute.Status != models.DisputeStatusOpen {
		writeError(w, http.StatusBadRequest, "dispute is already resolved")
		return
	}

	adminGH := AdminContextGitHub(r)
	now := time.Now().UTC()

	if action == "unclaim" {
		profile, err := a.store.FindProfileByID(r.Context(), dispute.ProfileID)
		if err != nil {
			writeError(w, http.StatusNotFound, "profile not found")
			return
		}
		if err := a.store.UnclaimProfile(r.Context(), profile.ID); err != nil {
			writeError(w, http.StatusInternalServerError, "could not unclaim profile")
			return
		}
		dispute.Status = models.DisputeStatusResolved
	} else {
		dispute.Status = models.DisputeStatusDismissed
	}

	dispute.AdminNote = strings.TrimSpace(body.AdminNote)
	dispute.ResolvedBy = adminGH
	dispute.ResolvedAt = now
	if err := a.store.UpdateDispute(r.Context(), dispute); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update dispute")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"dispute": dispute,
		"action":  action,
	})
}
