package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service/avatars"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service"
	"github.com/trustgraph/backend/internal/service/claim"
	"github.com/trustgraph/backend/internal/service/insights"
	"github.com/trustgraph/backend/internal/service/profilesync"
	emailsvc "github.com/trustgraph/backend/internal/service/email"
	devfoliosvc "github.com/trustgraph/backend/internal/service/devfolio"
	devpostsvc "github.com/trustgraph/backend/internal/service/devpost"
	"github.com/trustgraph/backend/internal/service/enrichment"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
	stackoverflowsvc "github.com/trustgraph/backend/internal/service/stackoverflow"
	recruitersvc "github.com/trustgraph/backend/internal/service/recruiter"
	"golang.org/x/crypto/bcrypt"
)

var handleRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$`)

type API struct {
	store         *repository.Store
	jwtSecret     string
	cfg           *config.Config
	github        *githubsvc.Client
	stackoverflow *stackoverflowsvc.Client
	devpost       *devpostsvc.Client
	devfolio      *devfoliosvc.Client
	email         *emailsvc.Client
	enrichment    *enrichment.Agent
	recruiterWorker *recruitersvc.Worker
}

func NewAPI(store *repository.Store, cfg *config.Config) *API {
	var mail *emailsvc.Client
	if cfg.EmailEnabled() {
		mail = emailsvc.NewClient(cfg.ResendAPIKey, cfg.EmailFrom, cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPFrom)
	}
	enrichmentAgent := enrichment.NewAgent(
		enrichment.NewFirecrawlClient(cfg.FirecrawlAPIKey),
		enrichment.NewTavilyClient(cfg.TavilyAPIKey),
		enrichment.NewNVIDIAClient(cfg.NVIDIAAPIKey, cfg.NVIDIAModel),
		enrichment.NewGeminiClient(cfg.GeminiAPIKey, cfg.GeminiModel),
		githubsvc.NewClient(cfg.GitHubToken),
	)
	api := &API{
		store:         store,
		jwtSecret:     cfg.JWTSecret,
		cfg:           cfg,
		github:        githubsvc.NewClient(cfg.GitHubToken),
		stackoverflow: stackoverflowsvc.NewClient(),
		devpost:       devpostsvc.NewClient(),
		devfolio:      devfoliosvc.NewClient(enrichmentAgent),
		email:         mail,
		enrichment:    enrichmentAgent,
	}
	api.recruiterWorker = recruitersvc.NewWorker(store, enrichmentAgent, api.recordScoreChange)
	return api
}

func (a *API) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "trustgraph-api"})
}

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Handle   string `json:"handle"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	Token   string         `json:"token"`
	User    models.User    `json:"user"`
	Profile *models.Profile `json:"profile,omitempty"`
}

func (a *API) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Handle = strings.TrimSpace(strings.ToLower(req.Handle))
	req.Name = strings.TrimSpace(req.Name)

	if req.Email == "" || req.Password == "" || req.Name == "" || req.Handle == "" {
		writeError(w, http.StatusBadRequest, "email, password, name, and handle are required")
		return
	}
	if len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	if !handleRegex.MatchString(req.Handle) {
		writeError(w, http.StatusBadRequest, "handle must be 3-30 lowercase alphanumeric characters")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
	}

	if err := a.store.CreateUser(r.Context(), user); err != nil {
		if err == repository.ErrDuplicate {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	now := time.Now().UTC()
	profile := &models.Profile{
		UserID:         user.ID,
		Handle:         req.Handle,
		DisplayName:    req.Name,
		IsClaimed:      true,
		OnboardingStep: 1,
		ActiveSince:    now,
		LastActivityAt: now,
	}
	profile.TrustScore = service.ComputeTrustScore(profile)

	if err := a.store.CreateProfile(r.Context(), profile); err != nil {
		if err == repository.ErrDuplicate {
			writeError(w, http.StatusConflict, "handle already taken")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not create profile")
		return
	}

	token, err := a.issueToken(user)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}

	writeJSON(w, http.StatusCreated, authResponse{Token: token, User: *user, Profile: profile})
}

func (a *API) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := a.store.FindUserByEmail(r.Context(), strings.TrimSpace(strings.ToLower(req.Email)))
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	profile, _ := a.store.FindProfileByUserID(r.Context(), user.ID)
	token, err := a.issueToken(user)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not issue token")
		return
	}

	writeJSON(w, http.StatusOK, authResponse{Token: token, User: *user, Profile: profile})
}

func (a *API) Me(w http.ResponseWriter, r *http.Request) {
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

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{"user": user})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user":    user,
		"profile": profile,
		"plan":    userPlan(user),
	})
}

func (a *API) GetProfile(w http.ResponseWriter, r *http.Request) {
	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	if profile.IsPrivate {
		if viewerID, ok := middleware.UserIDFromContext(r.Context()); !ok || profile.UserID != viewerID {
			writeError(w, http.StatusNotFound, "profile not found")
			return
		}
	}

	viewMode := "teaser"
	isOwner := false
	viewerPro := false
	viewerSignedIn := false
	if _, ok := clerk.SessionClaimsFromContext(r.Context()); ok {
		viewerSignedIn = true
	}
	if viewerID, ok := middleware.UserIDFromContext(r.Context()); ok {
		isOwner = profile.UserID == viewerID
		if user, err := a.store.FindUserByID(r.Context(), viewerID); err == nil {
			viewerPro = user.Plan == "pro"
		}
		switch {
		case isOwner:
			viewMode = "full"
		case profile.PublicBreakdown:
			viewMode = "full"
		default:
			viewMode = "summary"
		}
	} else if viewerSignedIn {
		viewMode = "summary"
	}

	a.backfillGitHubEmail(r.Context(), profile)

	view := a.toPublicView(r.Context(), profile, viewMode, isOwner, viewerPro)
	a.logProfileView(r, profile, isOwner)
	writeJSON(w, http.StatusOK, view)
}

func (a *API) GetTrustScore(w http.ResponseWriter, r *http.Request) {
	handle := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("handle")))
	mode := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("mode")))
	if mode == "" {
		mode = "full"
	}

	if handle == "" {
		writeError(w, http.StatusBadRequest, "handle query parameter is required")
		return
	}

	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	resp := models.TrustScoreResponse{Handle: handle, Mode: mode}

	switch mode {
	case "band":
		resp.ScoreBand = service.ScoreBand(profile.TrustScore.Overall)
	case "binary":
		threshold := 75.0
		above := profile.TrustScore.Overall >= threshold
		resp.AboveThreshold = &above
	default:
		resp.TrustScore = profile.TrustScore
	}

	writeJSON(w, http.StatusOK, resp)
}

func (a *API) CompleteOnboarding(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	profile, err := a.store.FindProfileByUserID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "profile not found")
		return
	}

	profile.OnboardingStep = 5
	profile.IsClaimed = true
	profile.TrustScore = service.ComputeTrustScore(profile)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update profile")
		return
	}

	writeJSON(w, http.StatusOK, profile)
}

func (a *API) ListProfiles(w http.ResponseWriter, r *http.Request) {
	profiles, err := a.store.ListProfiles(r.Context(), 12)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list profiles")
		return
	}

	views := make([]models.PublicProfileView, 0, len(profiles))
	for i := range profiles {
		views = append(views, a.toPublicView(r.Context(), &profiles[i], "teaser", false, false))
	}

	count, _ := a.store.CountProfiles(r.Context())
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"profiles": views,
		"total":    count,
	})
}

func (a *API) ClaimShadowProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	handle := strings.TrimSpace(strings.ToLower(r.PathValue("handle")))
	profile, err := a.store.FindProfileByHandle(r.Context(), handle)
	if err != nil {
		writeError(w, http.StatusNotFound, "shadow profile not found")
		return
	}
	if !profile.IsShadow || profile.IsClaimed {
		writeError(w, http.StatusBadRequest, "profile is not available to claim")
		return
	}

	user, err := a.store.FindUserByID(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "account not found")
		return
	}

	githubUser, err := claim.GitHubUsernameFromClerk(r.Context(), user.ClerkID)
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not verify GitHub connection")
		return
	}
	if verify := claim.VerifyGitHubHandleMatch(githubUser, handle); !verify.OK {
		writeError(w, http.StatusForbidden, verify.Message)
		return
	}

	existing, _ := a.store.FindProfileByUserID(r.Context(), userID)
	if existing != nil {
		if existing.Handle == handle {
			writeJSON(w, http.StatusOK, existing)
			return
		}
		if isRemovableStub(existing) {
			if err := a.store.DeleteStubProfile(r.Context(), existing.ID); err != nil {
				writeError(w, http.StatusInternalServerError, "could not prepare account for claim")
				return
			}
		} else {
			writeError(w, http.StatusConflict, "each account can only own one Trust Passport")
			return
		}
	}

	profile.UserID = userID
	profile.IsShadow = false
	profile.IsClaimed = true
	profile.OnboardingStep = 3

	if stats, fetchErr := a.github.FetchStats(r.Context(), githubUser); fetchErr == nil {
		profilesync.ApplyGitHub(profile, stats, a.cfg.GitHubToken != "")
	}
	profile.TrustScore = service.ComputeTrustScore(profile)
	profilesync.FinalizeProfileMetrics(profile)

	if err := a.store.UpdateProfile(r.Context(), profile); err != nil {
		writeError(w, http.StatusInternalServerError, "could not claim profile")
		return
	}

	writeJSON(w, http.StatusOK, profile)
}

func (a *API) issueToken(user *models.User) (string, error) {
	claims := middleware.Claims{
		UserID: user.ID.Hex(),
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(a.jwtSecret))
}

func (a *API) toPublicView(ctx context.Context, profile *models.Profile, mode string, isOwner, viewerPro bool) models.PublicProfileView {
	caps := profile.Capabilities
	if mode != "full" && len(caps) > 3 {
		caps = caps[:3]
	}

	proFeatures := isOwner && viewerPro

	view := models.PublicProfileView{
		Handle:              profile.Handle,
		DisplayName:         profile.DisplayName,
		Headline:            profile.Headline,
		AvatarURL:           avatars.Resolve(profile.Handle, profile.AvatarURL),
		TrustScore:          profile.TrustScore,
		Capabilities:        caps,
		EvidenceCount:       len(profile.Evidence),
		ActiveSince:         profile.ActiveSince,
		IsShadow:            profile.IsShadow,
		IsClaimed:           profile.IsClaimed,
		ViewMode:            mode,
		EstimatedScoreMin:   profile.EstimatedScoreMin,
		EstimatedScoreMax:   profile.EstimatedScoreMax,
		ProfileCompleteness: profile.ProfileCompleteness,
		IsPro:               proFeatures,
		IsOwner:             isOwner,
		Stats:               mapProfileStats(service.BuildProfileStats(profile.Evidence)),
		SocialLinks:         profile.SocialLinks,
		GitHubPublicEmail:   profile.GitHubPublicEmail,
		AIInsight:           profile.AIInsight,
		RecruiterReport:     profile.RecruiterReport,
		EnrichedSources:     profile.EnrichedSources,
	}

	if mode == "full" {
		view.Evidence = profile.Evidence
		view.Timeline = profile.Timeline
		view.RecruiterReport = profile.RecruiterReport
		if proFeatures {
			view.Insights = insights.BuildComparative(ctx, a.store, profile)
		}
		if isOwner {
			apiBase := fmt.Sprintf("http://localhost:%s", a.cfg.Port)
			view.BadgeMarkdown = fmt.Sprintf("[![TrustGraph](%s/badge/%s.svg)](%s/%s)",
				apiBase, profile.Handle, strings.TrimRight(a.cfg.FrontendURL, "/"), profile.Handle)
		}
	} else if mode == "summary" {
		view.Evidence = profile.Evidence
		view.Timeline = profile.Timeline
		if profile.RecruiterReport != nil {
			view.RecruiterReport = profile.RecruiterReport
		}
		view.TrustScore = models.TrustScore{
			Overall:    profile.TrustScore.Overall,
			Dimensions: profile.TrustScore.Dimensions,
			Delta:      profile.TrustScore.Delta,
			UpdatedAt:  profile.TrustScore.UpdatedAt,
			Positive:   profile.TrustScore.Positive,
			Negative:   profile.TrustScore.Negative,
		}
	} else {
		if profile.EstimatedScoreMin > 0 && profile.TrustScore.Overall == 0 {
			view.TrustScore = models.TrustScore{Overall: profile.EstimatedScoreMin, UpdatedAt: profile.TrustScore.UpdatedAt}
		} else {
			view.TrustScore = models.TrustScore{
				Overall:    profile.TrustScore.Overall,
				Dimensions: profile.TrustScore.Dimensions,
				UpdatedAt:  profile.TrustScore.UpdatedAt,
			}
		}
	}
	return view
}

func (a *API) backfillGitHubEmail(ctx context.Context, profile *models.Profile) {
	if profile == nil || profile.GitHubPublicEmail != "" || a.cfg.GitHubToken == "" {
		return
	}
	login := ""
	for _, ds := range profile.DataSources {
		if ds.Platform == "github" && strings.TrimSpace(ds.ExternalID) != "" {
			login = ds.ExternalID
			break
		}
	}
	if login == "" {
		login = profile.Handle
	}
	email, err := a.github.FetchPublicEmail(ctx, login)
	if err != nil || strings.TrimSpace(email) == "" {
		return
	}
	profile.GitHubPublicEmail = strings.TrimSpace(email)
	_ = a.store.UpdateProfile(ctx, profile)
}

func mapProfileStats(stats []service.ProfileStat) []models.ProfileStatView {
	if len(stats) == 0 {
		return nil
	}
	out := make([]models.ProfileStatView, len(stats))
	for i, s := range stats {
		out[i] = models.ProfileStatView{
			Key:      s.Key,
			Label:    s.Label,
			Value:    s.Value,
			Display:  s.Display,
			Platform: s.Platform,
			Category: s.Category,
			URL:      s.URL,
			Verified: s.Verified,
			Detail:   s.Detail,
		}
	}
	return out
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func userPlan(user *models.User) string {
	if user.Plan == "pro" {
		return "pro"
	}
	return "free"
}

func (a *API) logProfileView(r *http.Request, profile *models.Profile, isOwner bool) {
	if profile == nil || isOwner {
		return
	}
	viewerID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		return
	}
	viewer, err := a.store.FindUserByID(r.Context(), viewerID)
	if err != nil {
		return
	}
	searcherType := "passport"
	if viewer.AccountType == "recruiter" {
		searcherType = "recruiter"
	}
	_ = a.store.RecordProfileSearch(r.Context(), &models.ProfileSearchEvent{
		SearcherUserID: viewerID,
		SearcherType:   searcherType,
		ProfileID:      profile.ID,
		ProfileHandle:  profile.Handle,
		Source:         "knowledge_base",
	})
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
