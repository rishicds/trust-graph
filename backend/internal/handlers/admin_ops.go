package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/email"
	"github.com/trustgraph/backend/internal/service/profilesync"
)

func (a *API) AdminRerunRecruiterSearch(w http.ResponseWriter, r *http.Request) {
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

	_ = a.store.FailActiveRecruiterRunsForProfile(r.Context(), profile.ID, "superseded by admin rerun")

	run := &models.RecruiterSearchRun{
		ProfileID:       profile.ID,
		ProfileHandle:   profile.Handle,
		RequesterUserID: userID,
		Status:          models.RecruiterRunQueued,
		ScoreBefore:     profile.TrustScore.Overall,
	}
	if err := a.store.CreateRecruiterRun(r.Context(), run); err != nil {
		writeError(w, http.StatusInternalServerError, "could not queue recruiter search")
		return
	}
	a.recruiterWorker.Enqueue(run.ID)

	writeJSON(w, http.StatusAccepted, map[string]interface{}{
		"run_id":  run.ID.Hex(),
		"status":  run.Status,
		"handle":  handle,
		"message": "Admin recruiter deep search queued",
	})
}

func (a *API) AdminRescrapeProfile(w http.ResponseWriter, r *http.Request) {
	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	previous := profile.TrustScore.Overall
	ghLogin := githubLoginFromProfile(profile)
	if ghLogin != "" {
		stats, err := a.github.FetchStats(r.Context(), ghLogin)
		if err != nil {
			writeError(w, http.StatusBadGateway, "could not refresh GitHub evidence")
			return
		}
		profilesync.ApplyGitHub(profile, stats, a.cfg.GitHubToken != "")
	}

	a.applySupplementalEvidence(r.Context(), profile)

	if a.cfg.EnrichmentEnabled() {
		result, err := a.enrichment.EnrichProfile(r.Context(), profile)
		if err == nil && result != nil {
			profile.AIInsight = &result.Insight
			profile.EnrichedSources = result.EnrichedSources
			for _, item := range result.Evidence {
				if !hasEvidenceTitle(profile.Evidence, item.Title, item.Platform) {
					profile.Evidence = append(profile.Evidence, item)
				}
			}
		}
	}

	profilesync.FinalizeProfileMetrics(profile)
	profilesync.RecomputeScore(profile)
	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save profile")
		return
	}
	a.recordScoreChange(r.Context(), profile, previous)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"handle":  profile.Handle,
		"message": "Profile rescrape completed",
		"profile": profile,
	})
}

func githubLoginFromProfile(profile *models.Profile) string {
	if profile == nil {
		return ""
	}
	for _, src := range profile.DataSources {
		if src.Platform == "github" && src.Connected && src.ExternalID != "" {
			return strings.ToLower(strings.TrimSpace(src.ExternalID))
		}
	}
	if profile.IsShadow {
		return strings.ToLower(strings.TrimSpace(profile.Handle))
	}
	return ""
}

func (a *API) AdminListNewsletterSubscribers(w http.ResponseWriter, r *http.Request) {
	limit := int64(queryInt(r, "limit", 500))
	subs, err := a.store.ListNewsletterSubscribers(r.Context(), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list subscribers")
		return
	}
	total, _ := a.store.CountNewsletterSubscribers(r.Context())
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"subscribers": subs,
		"total":       total,
		"email_ready": a.email != nil && a.email.Enabled(),
	})
}

func (a *API) AdminPreviewNewsletter(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Subject    string `json:"subject"`
		BodyHTML   string `json:"body_html"`
		SampleEmail string `json:"sample_email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}

	sample := strings.ToLower(strings.TrimSpace(req.SampleEmail))
	includeCTA := true
	if sample != "" {
		if _, err := a.store.FindUserByEmail(r.Context(), sample); err == nil {
			includeCTA = false
		}
	}

	htmlOut := email.RenderNewsletterHTML(email.NewsletterOptions{
		Subject:          req.Subject,
		BodyHTML:         req.BodyHTML,
		FrontendURL:      a.cfg.FrontendURL,
		IncludeSignupCTA: includeCTA,
		Preview:          true,
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"html":              htmlOut,
		"includes_signup_cta": includeCTA,
	})
}

func (a *API) AdminSendNewsletter(w http.ResponseWriter, r *http.Request) {
	if a.email == nil || !a.email.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "email not configured — add RESEND_API_KEY or SMTP settings")
		return
	}

	var req struct {
		Subject     string   `json:"subject"`
		BodyHTML    string   `json:"body_html"`
		TestEmail   string   `json:"test_email"`
		SendToAll   bool     `json:"send_to_all"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	subject := strings.TrimSpace(req.Subject)
	if subject == "" {
		writeError(w, http.StatusBadRequest, "subject required")
		return
	}

	if test := strings.TrimSpace(req.TestEmail); test != "" {
		includeCTA := true
		if _, err := a.store.FindUserByEmail(r.Context(), strings.ToLower(test)); err == nil {
			includeCTA = false
		}
		htmlOut := email.RenderNewsletterHTML(email.NewsletterOptions{
			Subject:          subject,
			BodyHTML:         req.BodyHTML,
			FrontendURL:      a.cfg.FrontendURL,
			IncludeSignupCTA: includeCTA,
		})
		if err := a.email.SendHTML(r.Context(), test, subject, htmlOut); err != nil {
			writeError(w, http.StatusBadGateway, "could not send test email")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"sent": 1,
			"mode": "test",
		})
		return
	}

	if !req.SendToAll {
		writeError(w, http.StatusBadRequest, "set test_email or send_to_all")
		return
	}

	subs, err := a.store.ListNewsletterSubscribers(r.Context(), 5000)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load subscribers")
		return
	}
	emails := make([]string, 0, len(subs))
	for _, sub := range subs {
		emails = append(emails, sub.Email)
	}
	registered, err := a.store.RegisteredEmailSet(r.Context(), emails)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not resolve recipients")
		return
	}

	sent := 0
	var failures []string
	for _, sub := range subs {
		includeCTA := !registered[strings.ToLower(sub.Email)]
		htmlOut := email.RenderNewsletterHTML(email.NewsletterOptions{
			Subject:          subject,
			BodyHTML:         req.BodyHTML,
			FrontendURL:      a.cfg.FrontendURL,
			IncludeSignupCTA: includeCTA,
		})
		if err := a.email.SendHTML(r.Context(), sub.Email, subject, htmlOut); err != nil {
			failures = append(failures, sub.Email)
			continue
		}
		sent++
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"sent":     sent,
		"failed":   len(failures),
		"failures": failures,
		"mode":     "broadcast",
	})
}
