package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/models"
)

func (a *API) EmbedWidget(w http.ResponseWriter, r *http.Request) {
	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil || profile.IsPrivate {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	profileURL := fmt.Sprintf("%s/%s", strings.TrimRight(a.cfg.FrontendURL, "/"), handle)
	badgeURL := fmt.Sprintf("%s/badge/%s.svg", strings.TrimRight(a.cfg.FrontendURL, "/"), handle)
	if a.cfg.Port != "" {
		badgeURL = fmt.Sprintf("http://localhost:%s/badge/%s.svg", a.cfg.Port, handle)
	}

	fmt.Fprintf(w, `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:Inter,system-ui,sans-serif;margin:0;padding:16px;background:#f8fafc}
.card{max-width:360px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px}
.score{font-size:48px;font-weight:700;color:#0f172a}
.meta{color:#64748b;font-size:14px;margin-top:8px}
.cap{margin-top:12px;font-size:13px;color:#0f172a}
a{color:#2563eb;text-decoration:none}
</style></head><body>
<div class="card">
  <div class="score">%.0f</div>
  <div class="meta">TrustGraph · %s</div>
  <div class="meta">%d evidence items</div>
  <img src="%s" alt="TrustGraph badge" style="margin-top:12px;height:28px" />
  <div class="cap">%s</div>
  <p style="margin-top:16px"><a href="%s" target="_blank">View Trust Passport →</a></p>
</div></body></html>`,
		profile.TrustScore.Overall,
		profile.DisplayName,
		len(profile.Evidence),
		badgeURL,
		capabilitySummary(profile.Capabilities),
		profileURL,
	)
}

func capabilitySummary(caps []models.Capability) string {
	if len(caps) == 0 {
		return "Building evidence layer"
	}
	names := make([]string, 0, 3)
	for i, c := range caps {
		if i >= 3 {
			break
		}
		names = append(names, c.Name)
	}
	return strings.Join(names, " · ")
}
