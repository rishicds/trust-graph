package repository

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func (s *Store) SaveRecruiterCandidate(ctx context.Context, recruiterUserID, profileID primitive.ObjectID, handle, notes, savedFromQuery string) error {
	now := time.Now().UTC()
	handle = strings.ToLower(strings.TrimSpace(handle))
	_, err := s.recruiterSaved.UpdateOne(ctx,
		bson.M{
			"recruiter_user_id": recruiterUserID,
			"profile_handle":    handle,
		},
		bson.M{
			"$set": bson.M{
				"profile_id":       profileID,
				"notes":            notes,
				"saved_from_query": savedFromQuery,
			},
			"$setOnInsert": bson.M{
				"recruiter_user_id": recruiterUserID,
				"profile_handle":  handle,
				"created_at":      now,
			},
		},
		options.Update().SetUpsert(true),
	)
	return err
}

func (s *Store) RemoveRecruiterSavedCandidate(ctx context.Context, recruiterUserID primitive.ObjectID, handle string) error {
	res, err := s.recruiterSaved.DeleteOne(ctx, bson.M{
		"recruiter_user_id": recruiterUserID,
		"profile_handle":    strings.ToLower(strings.TrimSpace(handle)),
	})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ListRecruiterSavedCandidates(ctx context.Context, recruiterUserID primitive.ObjectID) ([]models.RecruiterSavedCandidate, error) {
	cur, err := s.recruiterSaved.Find(ctx,
		bson.M{"recruiter_user_id": recruiterUserID},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []models.RecruiterSavedCandidate
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) RecruiterStarredHandleSet(ctx context.Context, recruiterUserID primitive.ObjectID) (map[string]struct{}, error) {
	saved, err := s.ListRecruiterSavedCandidates(ctx, recruiterUserID)
	if err != nil {
		return nil, err
	}
	out := make(map[string]struct{}, len(saved))
	for _, item := range saved {
		out[strings.ToLower(strings.TrimSpace(item.ProfileHandle))] = struct{}{}
	}
	return out, nil
}

func (s *Store) IsRecruiterCandidateSaved(ctx context.Context, recruiterUserID primitive.ObjectID, handle string) (bool, error) {
	err := s.recruiterSaved.FindOne(ctx, bson.M{
		"recruiter_user_id": recruiterUserID,
		"profile_handle":    strings.ToLower(strings.TrimSpace(handle)),
	}).Err()
	if err == nil {
		return true, nil
	}
	if errors.Is(err, mongo.ErrNoDocuments) {
		return false, nil
	}
	return false, err
}
