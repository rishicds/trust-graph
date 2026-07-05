package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	RecruiterRunQueued    = "queued"
	RecruiterRunRunning   = "running"
	RecruiterRunCompleted = "completed"
	RecruiterRunFailed    = "failed"
)

const RecruiterCooldownDays = 7
const RecruiterWeeklyLimitPerUser = 3

type RecruiterReport struct {
	Summary                  string           `bson:"summary" json:"summary"`
	Highlights               []string         `bson:"highlights,omitempty" json:"highlights,omitempty"`
	RoleSignals              []string         `bson:"role_signals,omitempty" json:"role_signals,omitempty"`
	HiringSignals            []string         `bson:"hiring_signals,omitempty" json:"hiring_signals,omitempty"`
	RedFlags                 []string         `bson:"red_flags,omitempty" json:"red_flags,omitempty"`
	CrossPlatformConsistency string           `bson:"cross_platform_consistency,omitempty" json:"cross_platform_consistency,omitempty"`
	Gaps                     []string         `bson:"gaps,omitempty" json:"gaps,omitempty"`
	WebFindings              []RecruiterFinding `bson:"web_findings,omitempty" json:"web_findings,omitempty"`
	SourceURLs               []string         `bson:"source_urls,omitempty" json:"source_urls,omitempty"`
	Model                    string           `bson:"model,omitempty" json:"model,omitempty"`
	ScoreBefore              float64          `bson:"score_before" json:"score_before"`
	ScoreAfter               float64          `bson:"score_after" json:"score_after"`
	ScoreDelta               float64          `bson:"score_delta" json:"score_delta"`
	GeneratedAt              time.Time        `bson:"generated_at" json:"generated_at"`
	RequesterUserID          primitive.ObjectID `bson:"requester_user_id" json:"requester_user_id"`
}

type RecruiterFinding struct {
	Title    string `bson:"title" json:"title"`
	URL      string `bson:"url" json:"url"`
	Snippet  string `bson:"snippet" json:"snippet"`
	Platform string `bson:"platform" json:"platform"`
}

type RecruiterSearchRun struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProfileID         primitive.ObjectID `bson:"profile_id" json:"profile_id"`
	ProfileHandle     string             `bson:"profile_handle" json:"profile_handle"`
	RequesterUserID   primitive.ObjectID `bson:"requester_user_id" json:"requester_user_id"`
	Status            string             `bson:"status" json:"status"`
	Error             string             `bson:"error,omitempty" json:"error,omitempty"`
	ProgressPercent   int                `bson:"progress_percent" json:"progress_percent"`
	ProgressStep      string             `bson:"progress_step,omitempty" json:"progress_step,omitempty"`
	LiveFindings      []RecruiterFinding `bson:"live_findings,omitempty" json:"live_findings,omitempty"`
	ScoreBefore       float64            `bson:"score_before" json:"score_before"`
	ScoreAfter        float64            `bson:"score_after,omitempty" json:"score_after,omitempty"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	StartedAt         time.Time          `bson:"started_at,omitempty" json:"started_at,omitempty"`
	CompletedAt       time.Time          `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
}

type RecruiterEligibility struct {
	Eligible             bool       `json:"eligible"`
	Reason               string     `json:"reason,omitempty"`
	UserCooldownUntil    *time.Time `json:"user_cooldown_until,omitempty"`
	ProfileCooldownUntil *time.Time `json:"profile_cooldown_until,omitempty"`
	LastRunStatus        string     `json:"last_run_status,omitempty"`
	ActiveRunID          string     `json:"active_run_id,omitempty"`
}
