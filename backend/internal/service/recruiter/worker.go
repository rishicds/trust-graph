package recruiter

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/repository"
	"github.com/trustgraph/backend/internal/service/enrichment"
	"github.com/trustgraph/backend/internal/service/profilesync"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Worker struct {
	store      *repository.Store
	agent      *enrichment.Agent
	queue      chan primitive.ObjectID
	onScoreChange func(ctx context.Context, profile *models.Profile, previous float64)
}

func NewWorker(store *repository.Store, agent *enrichment.Agent, onScoreChange func(context.Context, *models.Profile, float64)) *Worker {
	w := &Worker{
		store:         store,
		agent:         agent,
		queue:         make(chan primitive.ObjectID, 32),
		onScoreChange: onScoreChange,
	}
	w.recoverPendingRuns()
	go w.loop()
	return w
}

func (w *Worker) recoverPendingRuns() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	runs, err := w.store.FindPendingRecruiterRuns(ctx)
	if err != nil {
		log.Printf("recruiter worker: could not recover pending runs: %v", err)
		return
	}
	for _, run := range runs {
		log.Printf("recruiter worker: re-queueing pending run %s (%s)", run.ID.Hex(), run.Status)
		w.Enqueue(run.ID)
	}
	if len(runs) > 0 {
		log.Printf("recruiter worker: recovered %d pending run(s)", len(runs))
	}
}

func (w *Worker) Enqueue(runID primitive.ObjectID) {
	select {
	case w.queue <- runID:
	default:
		go func() { w.queue <- runID }()
	}
}

func (w *Worker) loop() {
	for runID := range w.queue {
		w.process(runID)
	}
}

func (w *Worker) process(runID primitive.ObjectID) {
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Minute)
	defer cancel()

	run, err := w.store.FindRecruiterRunByID(ctx, runID)
	if err != nil {
		log.Printf("recruiter worker: run %s not found: %v", runID.Hex(), err)
		return
	}
	if run.Status == models.RecruiterRunCompleted || run.Status == models.RecruiterRunFailed {
		return
	}

	profile, err := w.store.FindProfileByID(ctx, run.ProfileID)
	if err != nil {
		run.Status = models.RecruiterRunFailed
		run.Error = "profile not found"
		run.CompletedAt = time.Now().UTC()
		_ = w.store.UpdateRecruiterRun(ctx, run)
		return
	}

	run.Status = models.RecruiterRunRunning
	run.ProgressPercent = 2
	run.ProgressStep = "Starting deep search"
	run.StartedAt = time.Now().UTC()
	_ = w.store.UpdateRecruiterRun(ctx, run)

	scoreBefore := profile.TrustScore.Overall
	progress := func(percent int, step string, finding *models.RecruiterFinding) error {
		if percent > 0 {
			run.ProgressPercent = percent
		}
		if step != "" {
			run.ProgressStep = step
		}
		if finding != nil {
			run.LiveFindings = append(run.LiveFindings, *finding)
		}
		return w.store.UpdateRecruiterRun(ctx, run)
	}
	result, err := w.agent.RecruiterDeepSearch(ctx, profile, scoreBefore, progress)
	if err != nil {
		run.Status = models.RecruiterRunFailed
		run.Error = err.Error()
		run.CompletedAt = time.Now().UTC()
		_ = w.store.UpdateRecruiterRun(ctx, run)
		log.Printf("recruiter worker: run %s failed: %v", runID.Hex(), err)
		return
	}

	report := result.Report
	report.ScoreBefore = scoreBefore
	report.RequesterUserID = run.RequesterUserID

	previous := profile.TrustScore.Overall
	profile.RecruiterReport = &report
	profile.LastRecruiterSearchAt = time.Now().UTC()
	profile.AIInsight = &result.Insight
	for _, src := range result.EnrichedSources {
		if !hasEnrichedURL(profile.EnrichedSources, src.URL) {
			profile.EnrichedSources = append(profile.EnrichedSources, src)
		}
	}
	for _, item := range result.Evidence {
		if !hasEvidence(profile.Evidence, item.Title, item.Platform) {
			profile.Evidence = append(profile.Evidence, item)
		}
	}
	profilesync.FinalizeProfileMetrics(profile)

	report.ScoreAfter = profile.TrustScore.Overall
	report.ScoreDelta = report.ScoreAfter - report.ScoreBefore
	profile.RecruiterReport = &report

	if err := w.store.UpdateProfile(ctx, profile); err != nil {
		run.Status = models.RecruiterRunFailed
		run.Error = "could not save profile"
		run.CompletedAt = time.Now().UTC()
		_ = w.store.UpdateRecruiterRun(ctx, run)
		return
	}

	if w.onScoreChange != nil {
		w.onScoreChange(ctx, profile, previous)
	}

	run.Status = models.RecruiterRunCompleted
	run.ProgressPercent = 100
	run.ProgressStep = "Complete"
	run.ScoreAfter = profile.TrustScore.Overall
	run.CompletedAt = time.Now().UTC()
	_ = w.store.UpdateRecruiterRun(ctx, run)
	log.Printf("recruiter worker: completed run %s for @%s (%.1f -> %.1f)", runID.Hex(), run.ProfileHandle, scoreBefore, profile.TrustScore.Overall)
}

func hasEnrichedURL(items []models.EnrichedSource, url string) bool {
	for _, item := range items {
		if item.URL == url {
			return true
		}
	}
	return false
}

func hasEvidence(items []models.EvidenceItem, title, platform string) bool {
	for _, item := range items {
		if item.Platform == platform && strings.EqualFold(item.Title, title) {
			return true
		}
	}
	return false
}
