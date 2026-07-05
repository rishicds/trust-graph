package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
)

var newsletterEmailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func (a *API) SubscribeNewsletter(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email  string `json:"email"`
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if !newsletterEmailRegex.MatchString(email) {
		writeError(w, http.StatusBadRequest, "enter a valid email address")
		return
	}

	source := strings.TrimSpace(req.Source)
	if source == "" {
		source = "footer"
	}

	created, err := a.store.SaveNewsletterEmail(r.Context(), email, source)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not save email")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"created": created,
		"message": "Thanks — you're on the list.",
	})
}
