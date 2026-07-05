package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RecruiterSearchFilters struct {
	MinTrustScore   float64  `json:"min_trust_score,omitempty"`
	DiscoverySource string   `json:"discovery_source,omitempty"` // all, indexed, web
	Location        string   `json:"location,omitempty"`
	Skills          []string `json:"skills,omitempty"`
	Tools           []string `json:"tools,omitempty"`
	Employers       []string `json:"employers,omitempty"`
	RequireEmployer *bool    `json:"require_employer,omitempty"`
	StarredOnly     bool     `json:"starred_only,omitempty"`
}

type ParsedRecruiterQuery struct {
	Raw             string   `json:"raw"`
	Skills          []string `json:"skills,omitempty"`
	Tools           []string `json:"tools,omitempty"`
	Location        string   `json:"location,omitempty"`
	Employers       []string `json:"employers,omitempty"`
	RequireEmployer bool     `json:"require_employer"`
}

type RecruiterSavedCandidate struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RecruiterUserID primitive.ObjectID `bson:"recruiter_user_id" json:"recruiter_user_id"`
	ProfileID       primitive.ObjectID `bson:"profile_id" json:"profile_id"`
	ProfileHandle   string             `bson:"profile_handle" json:"profile_handle"`
	Notes           string             `bson:"notes,omitempty" json:"notes,omitempty"`
	SavedFromQuery  string             `bson:"saved_from_query,omitempty" json:"saved_from_query,omitempty"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
}

type RecruiterSavedCandidateView struct {
	Handle         string  `json:"handle"`
	DisplayName    string  `json:"display_name"`
	Headline       string  `json:"headline,omitempty"`
	AvatarURL      string  `json:"avatar_url,omitempty"`
	TrustScore     float64 `json:"trust_score"`
	EvidenceCount  int     `json:"evidence_count"`
	Notes          string  `json:"notes,omitempty"`
	SavedFromQuery string  `json:"saved_from_query,omitempty"`
	SavedAt        string  `json:"saved_at"`
}
