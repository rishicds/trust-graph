package jobs

import (
	"context"
	"log"
	"time"

	"github.com/trustgraph/backend/internal/config"
	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/alerts"
	emailsvc "github.com/trustgraph/backend/internal/service/email"
	"github.com/trustgraph/backend/internal/service/profilesync"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
	stackoverflowsvc "github.com/trustgraph/backend/internal/service/stackoverflow"
)

type Runner struct {
	store         *repository.Store
	cfg           *config.Config
	github        *githubsvc.Client
	stackoverflow *stackoverflowsvc.Client
	email         *emailsvc.Client
}

func NewRunner(store *repository.Store, cfg *config.Config) *Runner {
	var mail *emailsvc.Client
	if cfg.EmailEnabled() {
		mail = emailsvc.NewClient(cfg.ResendAPIKey, cfg.EmailFrom, cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPFrom)
	}
	return &Runner{
		store:         store,
		cfg:           cfg,
		github:        githubsvc.NewClient(cfg.GitHubToken),
		stackoverflow: stackoverflowsvc.NewClient(),
		email:         mail,
	}
}

func (r *Runner) Start(ctx context.Context) {
	if !r.cfg.JobRefreshEnabled {
		return
	}
	go func() {
		r.refreshGitHub(ctx)
		r.refreshStackOverflow(ctx)
	}()
	go r.loop(ctx, 24*time.Hour, r.refreshGitHub)
	go r.loop(ctx, 7*24*time.Hour, r.refreshStackOverflow)
	go r.loop(ctx, 7*24*time.Hour, r.sendWeeklyDigests)
	log.Println("Background jobs started (initial sync + scheduled refresh)")
}

func (r *Runner) loop(ctx context.Context, interval time.Duration, fn func(context.Context)) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			fn(ctx)
		}
	}
}

func (r *Runner) refreshGitHub(ctx context.Context) {
	profiles, err := r.store.ListConnectedProfiles(ctx, "github")
	if err != nil {
		return
	}
	for i := range profiles {
		source := findSource(profiles[i].DataSources, "github")
		if source == nil {
			continue
		}
		stats, err := r.github.FetchStats(ctx, source.ExternalID)
		if err != nil {
			continue
		}
		previous := profiles[i].TrustScore.Overall
		profilesync.ApplyGitHub(&profiles[i], stats, true)
		if profiles[i].TrustScore.Overall != previous {
			profiles[i].TrustScore.Delta = profiles[i].TrustScore.Overall - previous
			_ = r.store.SaveScoreSnapshot(ctx, profiles[i].ID, profiles[i].TrustScore)
			r.maybeWebhook(ctx, &profiles[i], previous)
		}
		_ = r.store.UpdateProfile(ctx, &profiles[i])
	}
}

func (r *Runner) refreshStackOverflow(ctx context.Context) {
	profiles, err := r.store.ListConnectedProfiles(ctx, "stackoverflow")
	if err != nil {
		return
	}
	for i := range profiles {
		source := findSource(profiles[i].DataSources, "stackoverflow")
		if source == nil {
			continue
		}
		stats, err := r.stackoverflow.FetchByUsername(ctx, source.ExternalID)
		if err != nil {
			continue
		}
		previous := profiles[i].TrustScore.Overall
		profilesync.ApplyStackOverflow(&profiles[i], stats)
		if profiles[i].TrustScore.Overall != previous {
			profiles[i].TrustScore.Delta = profiles[i].TrustScore.Overall - previous
			_ = r.store.SaveScoreSnapshot(ctx, profiles[i].ID, profiles[i].TrustScore)
		}
		_ = r.store.UpdateProfile(ctx, &profiles[i])
	}
}

func (r *Runner) sendWeeklyDigests(ctx context.Context) {
	if r.email == nil {
		return
	}
	users, err := r.store.ListDigestUsers(ctx)
	if err != nil {
		return
	}
	for _, user := range users {
		profile, err := r.store.FindProfileByUserID(ctx, user.ID)
		if err != nil {
			continue
		}
		alertItems := alerts.BuildActivityAlerts(profile)
		messages := make([]string, 0, len(alertItems))
		for _, a := range alertItems {
			messages = append(messages, a.Message)
		}
		html := emailsvc.BuildWeeklyDigest(user.Name, profile.TrustScore.Overall, profile.TrustScore.Delta, messages, r.cfg.FrontendURL)
		if err := r.email.SendDigest(ctx, user.Email, "Your TrustGraph weekly digest", html); err != nil {
			continue
		}
		_ = r.store.MarkDigestSent(ctx, user.ID)
	}
}

func (r *Runner) maybeWebhook(ctx context.Context, profile *models.Profile, previous float64) {
	if profile.WebhookURL == "" {
		return
	}
	delta := profile.TrustScore.Overall - previous
	if delta > -5 && delta < 5 {
		return
	}
	_ = r.store.DispatchWebhook(ctx, profile)
}

func findSource(sources []models.DataSource, platform string) *models.DataSource {
	for i := range sources {
		if sources[i].Platform == platform && sources[i].Connected {
			return &sources[i]
		}
	}
	return nil
}
