package repository

import (
	"context"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AdminDisputeRow struct {
	ID             string `json:"id"`
	ProfileHandle  string `json:"profile_handle"`
	ReporterEmail  string `json:"reporter_email"`
	ReporterName   string `json:"reporter_name"`
	Reason         string `json:"reason"`
	Details        string `json:"details"`
	Status         string `json:"status"`
	AdminNote      string `json:"admin_note,omitempty"`
	ResolvedBy     string `json:"resolved_by,omitempty"`
	ResolvedAt     string `json:"resolved_at,omitempty"`
	CreatedAt      string `json:"created_at"`
}

func (s *Store) CreateDispute(ctx context.Context, dispute *models.ProfileDispute) error {
	now := time.Now().UTC()
	dispute.CreatedAt = now
	dispute.UpdatedAt = now
	if dispute.Status == "" {
		dispute.Status = models.DisputeStatusOpen
	}
	res, err := s.disputes.InsertOne(ctx, dispute)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrDuplicate
		}
		return err
	}
	dispute.ID = res.InsertedID.(primitive.ObjectID)
	return nil
}

func (s *Store) FindOpenDisputeByReporter(ctx context.Context, profileID, reporterID primitive.ObjectID) (*models.ProfileDispute, error) {
	var dispute models.ProfileDispute
	err := s.disputes.FindOne(ctx, bson.M{
		"profile_id":       profileID,
		"reporter_user_id": reporterID,
		"status":           models.DisputeStatusOpen,
	}).Decode(&dispute)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &dispute, nil
}

func (s *Store) FindDisputeByID(ctx context.Context, id primitive.ObjectID) (*models.ProfileDispute, error) {
	var dispute models.ProfileDispute
	err := s.disputes.FindOne(ctx, bson.M{"_id": id}).Decode(&dispute)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &dispute, nil
}

func (s *Store) ListDisputesAdmin(ctx context.Context, status string, limit, skip int64) ([]AdminDisputeRow, error) {
	filter := bson.M{}
	if status != "" && status != "all" {
		filter["status"] = status
	}
	opts := options.Find().
		SetLimit(limit).
		SetSkip(skip).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := s.disputes.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	rows := make([]AdminDisputeRow, 0)
	for cursor.Next(ctx) {
		var d models.ProfileDispute
		if err := cursor.Decode(&d); err != nil {
			return nil, err
		}
		row := AdminDisputeRow{
			ID:            d.ID.Hex(),
			ProfileHandle: d.ProfileHandle,
			ReporterEmail: d.ReporterEmail,
			ReporterName:  d.ReporterName,
			Reason:        d.Reason,
			Details:       d.Details,
			Status:        d.Status,
			AdminNote:     d.AdminNote,
			ResolvedBy:    d.ResolvedBy,
			CreatedAt:     d.CreatedAt.Format("2006-01-02 15:04"),
		}
		if !d.ResolvedAt.IsZero() {
			row.ResolvedAt = d.ResolvedAt.Format("2006-01-02 15:04")
		}
		rows = append(rows, row)
	}
	return rows, cursor.Err()
}

func (s *Store) CountOpenDisputes(ctx context.Context) (int64, error) {
	return s.disputes.CountDocuments(ctx, bson.M{"status": models.DisputeStatusOpen})
}

func (s *Store) UpdateDispute(ctx context.Context, dispute *models.ProfileDispute) error {
	dispute.UpdatedAt = time.Now().UTC()
	_, err := s.disputes.ReplaceOne(ctx, bson.M{"_id": dispute.ID}, dispute)
	return err
}

func (s *Store) UnclaimProfile(ctx context.Context, profileID primitive.ObjectID) error {
	now := time.Now().UTC()
	_, err := s.profiles.UpdateOne(ctx, bson.M{"_id": profileID}, bson.M{
		"$set": bson.M{
			"is_shadow":        true,
			"is_claimed":       false,
			"onboarding_step":  0,
			"updated_at":       now,
		},
		"$unset": bson.M{"user_id": ""},
	})
	return err
}

// DeleteStubProfile removes an auto-created empty profile so a user can claim a shadow.
func (s *Store) DeleteStubProfile(ctx context.Context, profileID primitive.ObjectID) error {
	_, err := s.profiles.DeleteOne(ctx, bson.M{"_id": profileID})
	return err
}
