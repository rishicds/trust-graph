package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/trustgraph/backend/internal/service"
)

func (a *API) TrustBadgeSVG(w http.ResponseWriter, r *http.Request) {
	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil || profile.IsPrivate {
		http.NotFound(w, r)
		return
	}

	score := profile.TrustScore.Overall
	band := service.ScoreBand(score)
	color := badgeColor(score)

	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="28" role="img" aria-label="TrustGraph score %s">
  <title>TrustGraph · %s · %s</title>
  <linearGradient id="g" x2="0" y2="100%%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-opacity=".1"/>
    <stop offset=".9" stop-opacity=".3"/>
    <stop offset="1" stop-opacity=".5"/>
  </linearGradient>
  <mask id="m"><rect width="220" height="28" rx="6" fill="#fff"/></mask>
  <g mask="url(#m)">
    <rect width="110" height="28" fill="#0f172a"/>
    <rect x="110" width="110" height="28" fill="%s"/>
    <rect width="220" height="28" fill="url(#g)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="ui-monospace,Consolas,monospace" font-size="12" font-weight="600">
    <text x="55" y="18">TrustGraph</text>
    <text x="165" y="18">%.0f · %s</text>
  </g>
</svg>`, band, handle, band, color, score, band)

	w.Header().Set("Content-Type", "image/svg+xml")
	w.Header().Set("Cache-Control", "public, max-age=300")
	_, _ = w.Write([]byte(svg))
}

func badgeColor(score float64) string {
	switch {
	case score >= 80:
		return "#0d9488"
	case score >= 60:
		return "#2563eb"
	default:
		return "#64748b"
	}
}

func badgeMarkdown(baseURL, handle string) string {
	url := fmt.Sprintf("%s/badge/%s.svg", strings.TrimRight(baseURL, "/"), handle)
	profileURL := fmt.Sprintf("%s/%s", strings.TrimRight(aFrontendURL(baseURL), "/"), handle)
	return fmt.Sprintf("[![TrustGraph](%s)](%s)", url, profileURL)
}

func aFrontendURL(apiBase string) string {
	if strings.Contains(apiBase, "localhost:8080") {
		return "http://localhost:3000"
	}
	return strings.Replace(apiBase, "api.", "", 1)
}
