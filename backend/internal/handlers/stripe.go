package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/trustgraph/backend/internal/middleware"
)

func (a *API) CreateCheckout(w http.ResponseWriter, r *http.Request) {
	if !a.cfg.StripeEnabled() {
		writeError(w, http.StatusNotImplemented, "stripe is not configured")
		return
	}

	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	form := url.Values{}
	form.Set("mode", "subscription")
	form.Set("success_url", a.cfg.FrontendURL+"/dashboard?upgraded=1")
	form.Set("cancel_url", a.cfg.FrontendURL+"/settings")
	form.Set("line_items[0][price]", a.cfg.StripeProPriceID)
	form.Set("line_items[0][quantity]", "1")
	form.Set("client_reference_id", userID.Hex())
	if user.Email != "" {
		form.Set("customer_email", user.Email)
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, "https://api.stripe.com/v1/checkout/sessions", strings.NewReader(form.Encode()))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create checkout")
		return
	}
	req.Header.Set("Authorization", "Bearer "+a.cfg.StripeSecretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		writeError(w, http.StatusBadGateway, "stripe unavailable")
		return
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		writeError(w, http.StatusBadGateway, "stripe checkout failed")
		return
	}

	var raw struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(body, &raw); err != nil || raw.URL == "" {
		writeError(w, http.StatusBadGateway, "invalid stripe response")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"checkout_url": raw.URL})
}

func (a *API) StripeWebhook(w http.ResponseWriter, r *http.Request) {
	if a.cfg.StripeWebhookSecret == "" {
		writeError(w, http.StatusNotImplemented, "webhook not configured")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}

	var event struct {
		Type string `json:"type"`
		Data struct {
			Object struct {
				Customer      string `json:"customer"`
				ClientRef     string `json:"client_reference_id"`
				Status        string `json:"status"`
			} `json:"object"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &event); err != nil {
		writeError(w, http.StatusBadRequest, "invalid payload")
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		if event.Data.Object.ClientRef != "" {
			if id, err := parseObjectID(event.Data.Object.ClientRef); err == nil {
				_ = a.store.UpdateUserPlan(r.Context(), id, "pro", event.Data.Object.Customer)
			}
		}
	case "customer.subscription.deleted":
		if event.Data.Object.Customer != "" {
			if user, err := a.store.FindUserByStripeCustomer(r.Context(), event.Data.Object.Customer); err == nil {
				_ = a.store.UpdateUserPlan(r.Context(), user.ID, "free", event.Data.Object.Customer)
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{"received": "true"})
}
