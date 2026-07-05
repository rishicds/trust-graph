package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/bootstrap"
)

func (a *API) SyncClerk(w http.ResponseWriter, r *http.Request) {
	claims, ok := clerk.SessionClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Handle string `json:"handle"`
	}
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&req)
	}

	clerkUser, err := clerkuser.Get(r.Context(), claims.Subject)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not fetch clerk user")
		return
	}

	identity := repository.ClerkIdentity{ClerkID: claims.Subject}
	if clerkUser.FirstName != nil {
		identity.Name = *clerkUser.FirstName
	}
	if clerkUser.LastName != nil {
		if identity.Name != "" {
			identity.Name += " "
		}
		identity.Name += *clerkUser.LastName
	}
	if identity.Name == "" && clerkUser.Username != nil {
		identity.Name = *clerkUser.Username
	}
	if len(clerkUser.EmailAddresses) > 0 {
		identity.Email = clerkUser.EmailAddresses[0].EmailAddress
	}
	if clerkUser.ImageURL != nil {
		identity.AvatarURL = *clerkUser.ImageURL
	}

	user, profile, err := a.store.EnsureClerkUser(r.Context(), identity, strings.TrimSpace(strings.ToLower(req.Handle)))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not sync account")
		return
	}

	var bootstrapResult *bootstrap.Result
	if profile != nil {
		bootstrapResult, _ = bootstrap.EnrichFromClerk(r.Context(), a.store, a.github, profile, clerkUser)
		if bootstrapResult != nil {
			profile = bootstrapResult.Profile
		}
	}

	resp := map[string]interface{}{
		"user": user,
	}
	if profile != nil {
		resp["profile"] = profile
	}
	claimHandle := strings.TrimSpace(strings.ToLower(req.Handle))
	if profile == nil && claimHandle != "" {
		resp["shadow_handle"] = claimHandle
		resp["bootstrap_message"] = "Connect GitHub and claim this shadow profile to unlock your Trust Passport."
	} else if bootstrapResult != nil && bootstrapResult.ShadowHandle != "" {
		resp["shadow_handle"] = bootstrapResult.ShadowHandle
		resp["bootstrap_message"] = "We found public evidence linked to your GitHub. You can claim the shadow profile."
	}

	writeJSON(w, http.StatusOK, resp)
}
