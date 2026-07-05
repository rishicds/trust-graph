package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/alerts"
	"github.com/trustgraph/backend/internal/service/claim"
	"github.com/trustgraph/backend/internal/service/clerkaccounts"
	"github.com/trustgraph/backend/internal/service/insights"
	"github.com/trustgraph/backend/internal/service/profilesync"
)

func (a *API) ConnectGitHub(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Username) == "" {
		writeError(w, http.StatusBadRequest, "github username is required")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "account not found")
		return
	}
	githubUser, err := claim.GitHubUsernameFromClerk(r.Context(), user.ClerkID)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not verify GitHub connection")
		return
	}
	if err := claim.VerifyGitHubConnect(githubUser, req.Username); err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	stats, err := a.github.FetchStats(r.Context(), req.Username)
	if err != nil {
		writeError(w, http.StatusBadRequest, "could not fetch GitHub profile — check the username")
		return
	}

	previous := profile.TrustScore.Overall
	profilesync.ApplyGitHub(profile, stats, a.cfg.GitHubToken != "")
	a.applySupplementalEvidence(r.Context(), profile)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update profile")
		return
	}
	a.recordScoreChange(r.Context(), profile, previous)

	writeJSON(w, http.StatusOK, profile)
}

func (a *API) ConnectStackOverflow(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Username) == "" {
		writeError(w, http.StatusBadRequest, "stack overflow username is required")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	stats, err := a.stackoverflow.FetchByUsername(r.Context(), req.Username)
	if err != nil {
		writeError(w, http.StatusBadRequest, "stack overflow user not found")
		return
	}

	previous := profile.TrustScore.Overall
	profilesync.ApplyStackOverflow(profile, stats)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update profile")
		return
	}
	a.recordScoreChange(r.Context(), profile, previous)

	writeJSON(w, http.StatusOK, profile)
}

func (a *API) ConnectLinkedIn(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Username string `json:"username"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil || user.ClerkID == "" {
		writeError(w, http.StatusBadRequest, "clerk account required to connect linkedin")
		return
	}

	clerkUser, err := clerkuser.Get(r.Context(), user.ClerkID)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not fetch clerk user")
		return
	}

	accounts := clerkaccounts.Parse(clerkUser)
	slug := accounts.LinkedInUsername
	if slug == "" {
		slug = clerkaccounts.NormalizeLinkedInSlug(req.Username)
	}

	if slug == "" {
		if accounts.LinkedInLinked {
			writeError(w, http.StatusBadRequest, "linkedin is linked in clerk — enter your linkedin.com/in/ profile slug and sync again")
			return
		}
		writeError(w, http.StatusBadRequest, "linkedin not connected in clerk — use Connect with LinkedIn first, then sync")
		return
	}

	if !accounts.LinkedInLinked {
		writeError(w, http.StatusBadRequest, "link linkedin in clerk first via Connect with LinkedIn, then sync")
		return
	}

	previous := profile.TrustScore.Overall
	profilesync.ApplyLinkedIn(profile, slug, accounts.LinkedInName)
	profilesync.FinalizeProfileMetrics(profile)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update profile")
		return
	}
	a.recordScoreChange(r.Context(), profile, previous)

	writeJSON(w, http.StatusOK, profile)
}

func (a *API) InvitePeerVerification(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		VerifierEmail string `json:"verifier_email"`
		SkillArea     string `json:"skill_area"`
		Context       string `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.VerifierEmail = strings.TrimSpace(strings.ToLower(req.VerifierEmail))
	req.SkillArea = strings.TrimSpace(req.SkillArea)
	if req.VerifierEmail == "" || req.SkillArea == "" {
		writeError(w, http.StatusBadRequest, "verifier_email and skill_area are required")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	vreq := &models.VerificationRequest{
		ProfileID:     profile.ID,
		RequesterID:   userID,
		VerifierEmail: req.VerifierEmail,
		SkillArea:     req.SkillArea,
		Context:       req.Context,
	}
	if err := a.store.CreateVerification(r.Context(), vreq); err != nil {
		writeError(w, http.StatusInternalServerError, "could not create verification request")
		return
	}

	confirmURL := fmt.Sprintf("%s/verify/%s", strings.TrimRight(a.cfg.FrontendURL, "/"), vreq.Token)
	if a.email != nil {
		html := fmt.Sprintf(`<p>You've been asked to verify a colleague's skill: <strong>%s</strong>.</p><p><a href="%s">Confirm verification</a></p>`, req.SkillArea, confirmURL)
		_ = a.email.SendDigest(r.Context(), req.VerifierEmail, "TrustGraph peer verification request", html)
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"verification": vreq,
		"confirm_url":  confirmURL,
	})
}

func (a *API) ConfirmPeerVerification(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(r.PathValue("token"))
	vreq, err := a.store.FindVerificationByToken(r.Context(), token)
	if err != nil {
		writeError(w, http.StatusNotFound, "verification request not found or expired")
		return
	}

	profile, err := a.store.FindProfileByID(r.Context(), vreq.ProfileID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	now := time.Now().UTC()
	profile.Evidence = append(profile.Evidence, models.EvidenceItem{
		Type:       "peer_reference",
		Title:      fmt.Sprintf("Peer verified: %s", vreq.SkillArea),
		Platform:   "trustgraph",
		Verified:   true,
		Count:      1,
		OccurredAt: now,
	})
	profile.LastActivityAt = now
	profile.OnboardingStep = maxInt(profile.OnboardingStep, 5)
	profilesync.RecomputeScore(profile)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update profile")
		return
	}
	if err := a.store.ConfirmVerification(r.Context(), vreq); err != nil {
		writeError(w, http.StatusInternalServerError, "could not confirm verification")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "confirmed",
		"handle":  profile.Handle,
		"message": "Peer verification recorded",
	})
}

func (a *API) ListVerifications(w http.ResponseWriter, r *http.Request) {
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

	items, err := a.store.ListVerificationsByProfile(r.Context(), profile.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list verifications")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"verifications": items})
}

func (a *API) ActivityAlerts(w http.ResponseWriter, r *http.Request) {
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

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	items := alerts.BuildActivityAlerts(profile)
	resp := map[string]interface{}{"alerts": items}
	if user.Plan == "pro" {
		resp["insights"] = insights.BuildComparative(r.Context(), a.store, profile)
	} else {
		resp["insights_locked"] = true
	}

	writeJSON(w, http.StatusOK, resp)
}

func randomState(seed string) string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf) + "." + seed
}
