package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/database"
	"github.com/trustgraph/backend/internal/handlers"
	"github.com/trustgraph/backend/internal/jobs"
	authmw "github.com/trustgraph/backend/internal/middleware"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/seed"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	mongoCtx, mongoCancel := context.WithTimeout(context.Background(), 15*time.Second)
	client, err := database.Connect(mongoCtx, cfg.MongoURI)
	mongoCancel()
	if err != nil {
		log.Fatalf("mongodb connect: %v", err)
	}
	defer client.Disconnect(context.Background())
	log.Printf("Connected to %s", cfg.MongoLogLabel())

	db := client.Database(cfg.MongoDatabase)
	if err := database.EnsureIndexes(context.Background(), db); err != nil {
		log.Fatalf("ensure indexes: %v", err)
	}

	if cfg.ClerkSecret == "" {
		log.Fatal("CLERK_SECRET_KEY is required in backend/.env")
	}
	clerk.SetKey(cfg.ClerkSecret)

	store := repository.NewStore(db)
	if err := seed.Profiles(context.Background(), store, cfg); err != nil {
		log.Printf("seed warning: %v", err)
	}

	api := handlers.NewAPI(store, cfg)
	jobs.NewRunner(store, cfg).Start(ctx)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-API-Key"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", api.Health)
	r.Get("/badge/{handle}.svg", api.TrustBadgeSVG)
	r.Get("/embed/{handle}", api.EmbedWidget)
	r.Post("/v1/billing/webhook", api.StripeWebhook)

	r.Route("/v1", func(r chi.Router) {
		r.Post("/auth/register", api.Register)
		r.Post("/auth/login", api.Login)
		r.Post("/newsletter/subscribe", api.SubscribeNewsletter)
		r.Post("/sales/contact", api.ContactSales)
		r.Get("/profiles", api.ListProfiles)
		r.Get("/preview/github/{username}", api.PreviewGitHub)
		r.Get("/verifications/{token}/confirm", api.ConfirmPeerVerification)

		r.Group(func(r chi.Router) {
			r.Use(authmw.APIKeyAuth(store))
			r.Use(authmw.OptionalClerkAuth())
			r.Use(authmw.OptionalResolveClerkUser(store))
			r.Get("/trust-score", api.GetTrustScore)
		})

		r.Group(func(r chi.Router) {
			r.Use(authmw.OptionalClerkAuth())
			r.Use(authmw.OptionalResolveClerkUser(store))
			r.Get("/profiles/{handle}", api.GetProfile)
			r.Get("/profiles/{handle}/insights", api.GetProfileInsights)
		})

		r.Group(func(r chi.Router) {
			r.Use(authmw.ClerkAuth())
			r.Post("/auth/clerk/sync", api.SyncClerk)
		})

		r.Group(func(r chi.Router) {
			r.Use(authmw.ClerkAuth())
			r.Use(authmw.ResolveClerkUser(store))
			r.Get("/me", api.Me)
			r.Get("/me/alerts", api.ActivityAlerts)
			r.Get("/me/score-history", api.ScoreHistory)
			r.Patch("/me/settings", api.UpdateSettings)
			r.Delete("/me", api.DeleteAccount)
			r.Post("/me/api-key", api.GenerateAPIKey)
			r.Post("/billing/checkout", api.CreateCheckout)
			r.Post("/profiles/connect/github", api.ConnectGitHub)
			r.Post("/profiles/connect/stackoverflow", api.ConnectStackOverflow)
			r.Post("/profiles/connect/devpost", api.ConnectDevpost)
			r.Post("/profiles/connect/devfolio", api.ConnectDevfolio)
			r.Post("/profiles/connect/linkedin", api.ConnectLinkedIn)
			r.Post("/profiles/enrich", api.RefreshProfileInsights)
			r.Get("/enrichment/capabilities", api.EnrichmentCapabilities)
			r.Get("/profiles/{handle}/recruiter/eligibility", api.RecruiterEligibility)
			r.Post("/profiles/{handle}/recruiter-search", api.StartRecruiterSearch)
			r.Get("/recruiter-runs/{runId}", api.GetRecruiterRun)
			r.Post("/profiles/claims/manual", api.AddManualClaim)
			r.Delete("/profiles/sources/{platform}", api.DisconnectSource)
			r.Post("/onboarding/complete", api.CompleteOnboarding)
			r.Post("/onboarding/account-type", api.SetAccountType)
			r.Post("/onboarding/segment", api.SetProfessionalSegment)
			r.Post("/recruiter/company/lookup", api.LookupRecruiterCompany)
			r.Get("/recruiter/company", api.GetRecruiterCompany)
			r.Post("/recruiter/company/refresh", api.RefreshRecruiterCompany)
			r.Post("/recruiter/onboarding/complete", api.CompleteRecruiterOnboarding)
			r.Post("/recruiter/search", api.RecruiterCandidateSearch)
			r.Get("/recruiter/saved", api.ListRecruiterSavedCandidates)
			r.Post("/recruiter/saved", api.SaveRecruiterCandidate)
			r.Delete("/recruiter/saved/{handle}", api.RemoveRecruiterSavedCandidate)
			r.Patch("/recruiter/hiring-segment", api.SetRecruiterHiringSegment)
			r.Get("/profiles/{handle}/claim/eligibility", api.ClaimEligibility)
			r.Post("/profiles/{handle}/claim", api.ClaimShadowProfile)
			r.Post("/profiles/{handle}/disputes", api.CreateProfileDispute)
			r.Post("/verifications/invite", api.InvitePeerVerification)
			r.Get("/verifications", api.ListVerifications)
		})

		r.Group(func(r chi.Router) {
			r.Use(authmw.ClerkAuth())
			r.Get("/admin/me", api.AdminMe)
		})

		r.Group(func(r chi.Router) {
			r.Use(authmw.ClerkAuth())
			r.Use(authmw.ResolveClerkUser(store))
			r.Use(authmw.RequireAdmin(cfg, store))
			r.Get("/admin/stats", api.AdminStats)
			r.Get("/admin/profiles", api.AdminListProfiles)
			r.Get("/admin/users", api.AdminListUsers)
			r.Patch("/admin/users/{userId}/plan", api.AdminSetUserPlan)
			r.Get("/admin/disputes", api.AdminListDisputes)
			r.Patch("/admin/disputes/{disputeId}", api.AdminResolveDispute)
			r.Post("/admin/profiles/{handle}/recruiter-search", api.AdminRerunRecruiterSearch)
			r.Post("/admin/profiles/{handle}/rescrape", api.AdminRescrapeProfile)
			r.Get("/admin/newsletter/subscribers", api.AdminListNewsletterSubscribers)
			r.Post("/admin/newsletter/preview", api.AdminPreviewNewsletter)
			r.Post("/admin/newsletter/send", api.AdminSendNewsletter)
		})
	})

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	go func() {
		log.Printf("TrustGraph API listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	_ = server.Shutdown(shutdownCtx)
}
