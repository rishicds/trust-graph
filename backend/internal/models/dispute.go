package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	DisputeStatusOpen      = "open"
	DisputeStatusDismissed = "dismissed"
	DisputeStatusResolved  = "resolved"
)

type ProfileDispute struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProfileID       primitive.ObjectID `bson:"profile_id" json:"profile_id"`
	ProfileHandle   string             `bson:"profile_handle" json:"profile_handle"`
	ReporterUserID  primitive.ObjectID `bson:"reporter_user_id" json:"reporter_user_id"`
	ReporterEmail   string             `bson:"reporter_email,omitempty" json:"reporter_email,omitempty"`
	ReporterName    string             `bson:"reporter_name,omitempty" json:"reporter_name,omitempty"`
	Reason          string             `bson:"reason" json:"reason"`
	Details         string             `bson:"details,omitempty" json:"details,omitempty"`
	Status          string             `bson:"status" json:"status"`
	AdminNote       string             `bson:"admin_note,omitempty" json:"admin_note,omitempty"`
	ResolvedBy      string             `bson:"resolved_by,omitempty" json:"resolved_by,omitempty"`
	ResolvedAt      time.Time          `bson:"resolved_at,omitempty" json:"resolved_at,omitempty"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}
