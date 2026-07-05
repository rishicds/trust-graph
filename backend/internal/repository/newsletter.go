package repository

import (
	"context"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func (s *Store) SaveNewsletterEmail(ctx context.Context, email, source string) (bool, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	now := time.Now().UTC()

	res, err := s.newsletter.UpdateOne(
		ctx,
		bson.M{"email": email},
		bson.M{
			"$setOnInsert": bson.M{
				"email":      email,
				"source":     strings.TrimSpace(source),
				"created_at": now,
			},
		},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return false, nil
		}
		return false, err
	}
	return res.UpsertedCount > 0, nil
}

func (s *Store) CountNewsletterSubscribers(ctx context.Context) (int64, error) {
	return s.newsletter.CountDocuments(ctx, bson.M{})
}

func (s *Store) RegisteredEmailSet(ctx context.Context, emails []string) (map[string]bool, error) {
	if len(emails) == 0 {
		return map[string]bool{}, nil
	}
	normalized := make([]string, 0, len(emails))
	for _, e := range emails {
		e = strings.ToLower(strings.TrimSpace(e))
		if e != "" {
			normalized = append(normalized, e)
		}
	}
	cur, err := s.users.Find(ctx, bson.M{"email": bson.M{"$in": normalized}}, options.Find().SetProjection(bson.M{"email": 1}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := map[string]bool{}
	for cur.Next(ctx) {
		var row struct {
			Email string `bson:"email"`
		}
		if err := cur.Decode(&row); err != nil {
			continue
		}
		out[strings.ToLower(row.Email)] = true
	}
	return out, nil
}

func (s *Store) FailActiveRecruiterRunsForProfile(ctx context.Context, profileID primitive.ObjectID, reason string) error {
	now := time.Now().UTC()
	_, err := s.recruiterSearchRuns.UpdateMany(ctx, bson.M{
		"profile_id": profileID,
		"status":     bson.M{"$in": []string{models.RecruiterRunQueued, models.RecruiterRunRunning}},
	}, bson.M{"$set": bson.M{
		"status":        models.RecruiterRunFailed,
		"error_message": reason,
		"completed_at":  now,
	}})
	return err
}

func (s *Store) ListNewsletterSubscribers(ctx context.Context, limit int64) ([]models.NewsletterSubscriber, error) {
	if limit <= 0 {
		limit = 100
	}
	cur, err := s.newsletter.Find(ctx, bson.M{}, options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(limit))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []models.NewsletterSubscriber
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}
