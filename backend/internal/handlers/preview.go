package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/avatars"
	"github.com/trustgraph/backend/internal/service/profilesync"
	"github.com/trustgraph/backend/internal/service"
)

func (a *API) PreviewGitHub(w http.ResponseWriter, r *http.Request) {
	username := strings.TrimSpace(strings.ToLower(r.PathValue("username")))
	if username == "" {
		writeError(w, http.StatusBadRequest, "github username is required")
		return
	}

	stats, err := a.github.FetchStats(r.Context(), username)
	if err != nil {
		writeError(w, http.StatusBadRequest, "could not find that GitHub user — check the username")
		return
	}

	handle := strings.ToLower(stats.User.Login)

	existing, findErr := a.store.FindProfileByHandle(r.Context(), handle)
	var profile *models.Profile
	switch {
	case findErr == repository.ErrNotFound:
		profile = profilesync.BuildShadowProfile(handle, stats)
		a.applySupplementalEvidence(r.Context(), profile)
		_ = a.store.UpsertProfileByHandle(r.Context(), profile)
	case findErr == nil && existing.IsClaimed:
		profile = existing
	case findErr == nil && existing.IsShadow && !existing.IsClaimed:
		// Refresh GitHub evidence only — keep AI insights, recruiter reports, and enriched sources.
		profile = existing
		profilesync.ApplyGitHub(profile, stats, true)
		a.applySupplementalEvidence(r.Context(), profile)
		_ = a.store.UpdateProfile(r.Context(), profile)
	default:
		writeError(w, http.StatusInternalServerError, "could not load profile")
		return
	}

	frontend := strings.TrimRight(a.cfg.FrontendURL, "/")
	capabilities := make([]map[string]interface{}, 0, len(profile.Capabilities))
	for _, cap := range profile.Capabilities {
		capabilities = append(capabilities, map[string]interface{}{
			"name":            cap.Name,
			"evidence_count":  cap.Evidence,
			"verified":        cap.Verified,
		})
	}

	highlights := previewHighlights(profile.Evidence)

	flagship := map[string]interface{}{}
	if stats.TopRepoName != "" {
		flagship["name"] = stats.TopRepoName
		flagship["url"] = stats.TopRepoURL
		flagship["stars"] = stats.TopRepoStars
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"github_username":   stats.User.Login,
		"handle":            profile.Handle,
		"display_name":      profile.DisplayName,
		"headline":          profile.Headline,
		"avatar_url":        avatars.Resolve(profile.Handle, profile.AvatarURL),
		"trust_score":       profile.TrustScore,
		"capabilities":      capabilities,
		"evidence_count":    len(profile.Evidence),
		"evidence_highlights": highlights,
		"stats":               mapProfileStats(service.BuildProfileStats(profile.Evidence)),
		"social_links":        profile.SocialLinks,
		"github_public_email": profile.GitHubPublicEmail,
		"flagship_repo":       flagship,
		"is_shadow":           profile.IsShadow,
		"is_claimed":        profile.IsClaimed,
		"passport_url":      frontend + "/" + profile.Handle,
		"invite_url":        frontend + "/sign-up?claim=" + profile.Handle,
		"github_url":        "https://github.com/" + stats.User.Login,
	})
}

func previewHighlights(evidence []models.EvidenceItem) []string {
	var out []string
	for _, e := range evidence {
		switch e.Type {
		case "merged_pr", "community_reach", "open_source_impact", "flagship_project":
			if e.Count > 0 {
				out = append(out, e.Title+" ("+formatCount(e.Count)+")")
			} else {
				out = append(out, e.Title)
			}
		}
		if len(out) >= 4 {
			break
		}
	}
	return out
}

func formatCount(n int) string {
	if n >= 1000000 {
		return strings.TrimSuffix(strings.TrimSuffix(fmt.Sprintf("%.1fM", float64(n)/1000000), "0"), ".") + "M"
	}
	if n >= 1000 {
		return strings.TrimSuffix(strings.TrimSuffix(fmt.Sprintf("%.1fK", float64(n)/1000), "0"), ".") + "K"
	}
	return fmt.Sprintf("%d", n)
}
