package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
)

func (a *API) ContactSales(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CompanyName string `json:"company_name"`
		Email       string `json:"email"`
		Plan        string `json:"plan"`
		Source      string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	companyName := strings.TrimSpace(req.CompanyName)
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if companyName == "" {
		writeError(w, http.StatusBadRequest, "company name is required")
		return
	}
	if !newsletterEmailRegex.MatchString(email) {
		writeError(w, http.StatusBadRequest, "enter a valid contact email")
		return
	}

	plan := strings.TrimSpace(req.Plan)
	if plan == "" {
		plan = "recruiter"
	}
	source := strings.TrimSpace(req.Source)
	if source == "" {
		source = "pricing"
	}

	if err := a.store.CreateSalesInquiry(r.Context(), companyName, email, plan, source); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save inquiry")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"message": "Thanks — we'll reach out shortly.",
	})
}
