package handlers

import (
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/claim"
)

func (a *API) ClaimEligibility(w http.ResponseWriter, r *http.Request) {
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

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "account not found")
		return
	}

	result := claim.VerificationResult{RequiredGitHub: handle}

	if !profile.IsShadow || profile.IsClaimed {
		result.OK = false
		result.Reason = "not_claimable"
		result.Message = "This profile is not available to claim."
		writeJSON(w, http.StatusOK, result)
		return
	}

	existing, _ := a.store.FindProfileByUserID(r.Context(), userID)
	if existing != nil {
		if isRemovableStub(existing) && strings.ToLower(existing.Handle) != handle {
			// User has an empty auto-created profile — claim can replace it after verification.
		} else if existing.Handle == handle {
			result.OK = false
			result.Reason = "already_claimed"
			result.Message = "You already own this profile."
			result.AlreadyHasProfile = true
			writeJSON(w, http.StatusOK, result)
			return
		} else {
			result.OK = false
			result.Reason = "already_has_profile"
			result.Message = "Each account can only own one Trust Passport."
			result.AlreadyHasProfile = true
			writeJSON(w, http.StatusOK, result)
			return
		}
	}

	githubUser, err := claim.GitHubUsernameFromClerk(r.Context(), user.ClerkID)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not verify GitHub connection")
		return
	}

	result = claim.VerifyGitHubHandleMatch(githubUser, handle)
	writeJSON(w, http.StatusOK, result)
}

func isRemovableStub(profile *models.Profile) bool {
	if profile == nil || profile.IsShadow {
		return false
	}
	if profile.OnboardingStep > 1 {
		return false
	}
	if len(profile.Evidence) > 0 {
		return false
	}
	for _, src := range profile.DataSources {
		if src.Connected {
			return false
		}
	}
	return true
}
