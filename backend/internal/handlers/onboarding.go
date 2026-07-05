package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	recruitersvc "github.com/trustgraph/backend/internal/service/recruiter"
	"go.mongodb.org/mongo-driver/bson"
)

var allowedSegments = map[string]struct{}{
	"developer":  {},
	"designer":   {},
	"researcher": {},
	"founder":    {},
	"general":    {},
}

func (a *API) SetAccountType(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		AccountType string `json:"account_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	accountType := strings.TrimSpace(strings.ToLower(req.AccountType))
	if accountType != "passport" && accountType != "recruiter" {
		writeError(w, http.StatusBadRequest, "account_type must be passport or recruiter")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if user.AccountType != "" && user.AccountType != accountType {
		writeError(w, http.StatusBadRequest, "account type already set")
		return
	}

	set := bson.M{"account_type": accountType}
	if accountType == "recruiter" {
		set["recruiter_onboarding_complete"] = false
	}
	if err := a.store.UpdateUserFields(r.Context(), userID, set); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update account")
		return
	}

	user.AccountType = accountType
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user})
}

func (a *API) SetProfessionalSegment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Segment string `json:"segment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	segment := strings.TrimSpace(strings.ToLower(req.Segment))
	if segment != "developer" {
		writeError(w, http.StatusBadRequest, "only developer segment is available right now")
		return
	}
	if _, ok := allowedSegments[segment]; !ok {
		writeError(w, http.StatusBadRequest, "invalid segment")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if user.AccountType != "passport" && user.AccountType != "" {
		writeError(w, http.StatusBadRequest, "segment selection is for Trust Passport accounts")
		return
	}

	claims, _ := clerk.SessionClaimsFromContext(r.Context())
	identity := repository.ClerkIdentity{ClerkID: claims.Subject}
	if clerkUser, err := clerkuser.Get(r.Context(), claims.Subject); err == nil {
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
	}

	if user.AccountType == "" {
		_ = a.store.UpdateUserFields(r.Context(), userID, bson.M{"account_type": "passport"})
		user.AccountType = "passport"
	}

	profile, err := a.store.CreatePassportProfileForUser(r.Context(), user, identity, "")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create profile")
		return
	}

	if err := a.store.UpdateUserFields(r.Context(), userID, bson.M{"professional_segment": segment}); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save segment")
		return
	}

	user.ProfessionalSegment = segment
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user":    user,
		"profile": profile,
	})
}

func (a *API) LookupRecruiterCompany(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var input recruitersvc.CompanyInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.Normalize()
	if input.LinkedInURL == "" && input.WebsiteURL == "" {
		writeError(w, http.StatusBadRequest, "linkedin_url or website_url required")
		return
	}

	scraper := recruitersvc.NewCompanyScraper(
		a.enrichment.Firecrawl(),
		a.enrichment.Gemini(),
	)
	company, cached, err := scraper.Resolve(r.Context(), a.store, input)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not resolve company details")
		return
	}

	_ = userID
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"company": company,
		"cached":  cached,
	})
}

func (a *API) CompleteRecruiterOnboarding(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		recruitersvc.CompanyInput
		HiringSegment string `json:"hiring_segment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Normalize()
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "company name required")
		return
	}
	if req.Email == "" {
		writeError(w, http.StatusBadRequest, "company email required")
		return
	}
	if req.LinkedInURL == "" && req.WebsiteURL == "" {
		writeError(w, http.StatusBadRequest, "company page url required")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if user.AccountType != "recruiter" {
		writeError(w, http.StatusBadRequest, "recruiter account required")
		return
	}

	scraper := recruitersvc.NewCompanyScraper(
		a.enrichment.Firecrawl(),
		a.enrichment.Gemini(),
	)
	company, _, err := scraper.Resolve(r.Context(), a.store, req.CompanyInput)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not resolve company details")
		return
	}
	company.Name = req.Name
	company.Email = req.Email
	company.LinkedInURL = req.LinkedInURL
	company.WebsiteURL = req.WebsiteURL

	if err := recruitersvc.AttachCompanyToUser(r.Context(), a.store, userID, company); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save company")
		return
	}

	hiringSegment := strings.TrimSpace(strings.ToLower(req.HiringSegment))
	if hiringSegment == "" {
		hiringSegment = "developer"
	}
	_ = a.store.UpdateUserFields(r.Context(), userID, bson.M{"hiring_segment": hiringSegment})

	user.RecruiterCompanyID = company.ID
	user.CompanyEmail = company.Email
	user.RecruiterOnboardingComplete = true
	user.HiringSegment = hiringSegment

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user":    user,
		"company": company,
	})
}

func (a *API) GetRecruiterCompany(w http.ResponseWriter, r *http.Request) {
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
	if user.AccountType != "recruiter" || !user.RecruiterOnboardingComplete {
		writeError(w, http.StatusForbidden, "recruiter onboarding incomplete")
		return
	}

	company, err := a.store.ResolveRecruiterCompanyForUser(r.Context(), user)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{"company": nil})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"company": company})
}

func (a *API) RefreshRecruiterCompany(w http.ResponseWriter, r *http.Request) {
	user, ok := a.requireRecruiter(w, r)
	if !ok {
		return
	}

	company, err := a.store.ResolveRecruiterCompanyForUser(r.Context(), &user)
	if err != nil {
		writeError(w, http.StatusNotFound, "no company linked to your account")
		return
	}

	scraper := recruitersvc.NewCompanyScraper(
		a.enrichment.Firecrawl(),
		a.enrichment.Gemini(),
	)
	input := recruitersvc.CompanyInput{
		Name:        company.Name,
		Email:       company.Email,
		LinkedInURL: company.LinkedInURL,
		WebsiteURL:  company.WebsiteURL,
	}
	refreshed, _, err := scraper.Resolve(r.Context(), a.store, input)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not refresh company profile")
		return
	}
	refreshed.ID = company.ID
	refreshed.CreatedBy = user.ID
	if refreshed.Name == "" {
		refreshed.Name = company.Name
	}
	if refreshed.Email == "" {
		refreshed.Email = company.Email
	}
	if err := a.store.UpsertRecruiterCompany(r.Context(), refreshed); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save company profile")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"company": refreshed})
}

func (a *API) RecruiterCandidateSearch(w http.ResponseWriter, r *http.Request) {
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
	if user.AccountType != "recruiter" || !user.RecruiterOnboardingComplete {
		writeError(w, http.StatusForbidden, "recruiter onboarding incomplete")
		return
	}

	var req struct {
		Query   string                      `json:"query"`
		Segment string                      `json:"segment"`
		Limit   int                         `json:"limit"`
		Filters models.RecruiterSearchFilters `json:"filters"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Query = strings.TrimSpace(req.Query)
	if req.Query == "" {
		writeError(w, http.StatusBadRequest, "query required")
		return
	}

	segment := strings.TrimSpace(strings.ToLower(req.Segment))
	if segment == "" {
		segment = user.HiringSegment
	}
	if segment == "" {
		segment = "developer"
	}

	search := recruitersvc.NewTalentSearch(a.store, a.enrichment.Tavily(), a.enrichment.Firecrawl(), a.github)
	starred, err := a.store.RecruiterStarredHandleSet(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load saved candidates")
		return
	}
	response, err := search.Search(r.Context(), req.Query, segment, req.Limit, req.Filters, starred)
	if err != nil {
		writeError(w, http.StatusBadGateway, "search failed")
		return
	}

	for _, result := range response.Results {
		profile, findErr := a.store.FindProfileByHandle(r.Context(), result.Handle)
		if findErr != nil {
			continue
		}
		source := "knowledge_base"
		if result.DiscoverySource == "web" {
			source = "web_search"
		}
		_ = a.store.RecordProfileSearch(r.Context(), &models.ProfileSearchEvent{
			SearcherUserID: userID,
			SearcherType:   "recruiter",
			Query:          req.Query,
			ProfileID:      profile.ID,
			ProfileHandle:  profile.Handle,
			Source:         source,
		})
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"results": response.Results,
		"total":   len(response.Results),
		"meta":    response.Meta,
	})
}

func (a *API) SetRecruiterHiringSegment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Segment string `json:"segment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	segment := strings.TrimSpace(strings.ToLower(req.Segment))
	if segment != "developer" {
		writeError(w, http.StatusBadRequest, "only developer segment is available right now")
		return
	}

	if err := a.store.UpdateUserFields(r.Context(), userID, bson.M{"hiring_segment": segment}); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update hiring segment")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"hiring_segment": segment})
}
