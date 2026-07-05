package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/admin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (a *API) AdminMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := clerk.SessionClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	allowed, ghUser, err := admin.IsAuthorized(r.Context(), a.cfg, a.store, claims.Subject)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not verify admin access")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"admin":            allowed,
		"github_username":  ghUser,
		"email_configured": a.email != nil && a.email.Enabled(),
	})
}

func (a *API) AdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := a.store.AdminStats(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load stats")
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (a *API) AdminListProfiles(w http.ResponseWriter, r *http.Request) {
	limit := queryInt(r, "limit", 50)
	skip := queryInt(r, "offset", 0)
	if limit > 200 {
		limit = 200
	}

	rows, err := a.store.ListProfilesAdmin(r.Context(), int64(limit), int64(skip))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list profiles")
		return
	}

	total, _ := a.store.CountProfiles(r.Context())
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"profiles": rows,
		"total":    total,
		"limit":    limit,
		"offset":   skip,
	})
}

func (a *API) AdminListUsers(w http.ResponseWriter, r *http.Request) {
	limit := queryInt(r, "limit", 50)
	skip := queryInt(r, "offset", 0)
	if limit > 200 {
		limit = 200
	}

	rows, err := a.store.ListUsersAdmin(r.Context(), int64(limit), int64(skip))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list users")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"users":  rows,
		"limit":  limit,
		"offset": skip,
	})
}

func (a *API) AdminSetUserPlan(w http.ResponseWriter, r *http.Request) {
	userID, err := primitive.ObjectIDFromHex(r.PathValue("userId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var body struct {
		Plan string `json:"plan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}

	plan := strings.ToLower(strings.TrimSpace(body.Plan))
	if plan != "pro" && plan != "free" {
		writeError(w, http.StatusBadRequest, "plan must be pro or free")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	if err := a.store.UpdateUserPlan(r.Context(), userID, plan, user.StripeCustomerID); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update plan")
		return
	}

	user.Plan = plan
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user": adminUserRowFromModel(a.store, r.Context(), user),
	})
}

func adminUserRowFromModel(store *repository.Store, ctx context.Context, user *models.User) repository.AdminUserRow {
	row := repository.AdminUserRow{
		ID:        user.ID.Hex(),
		Email:     user.Email,
		Name:      user.Name,
		Plan:      user.Plan,
		CreatedAt: user.CreatedAt.Format("2006-01-02"),
	}
	if profile, err := store.FindProfileByUserID(ctx, user.ID); err == nil {
		row.Handle = profile.Handle
	}
	return row
}

func queryInt(r *http.Request, key string, fallback int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 0 {
		return fallback
	}
	return n
}

// AdminContextGitHub returns the verified admin GitHub username set by middleware.
func AdminContextGitHub(r *http.Request) string {
	return middleware.AdminGitHubFromContext(r.Context())
}
