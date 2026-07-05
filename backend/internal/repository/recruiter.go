package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func recruiterCooldownSince() time.Time {
	return time.Now().UTC().Add(-time.Duration(models.RecruiterCooldownDays) * 24 * time.Hour)
}

func (s *Store) CreateRecruiterRun(ctx context.Context, run *models.RecruiterSearchRun) error {
	run.CreatedAt = time.Now().UTC()
	if run.ID.IsZero() {
		run.ID = primitive.NewObjectID()
	}
	_, err := s.recruiterSearchRuns.InsertOne(ctx, run)
	return err
}

func (s *Store) UpdateRecruiterRun(ctx context.Context, run *models.RecruiterSearchRun) error {
	_, err := s.recruiterSearchRuns.ReplaceOne(ctx, bson.M{"_id": run.ID}, run)
	return err
}

func (s *Store) FindRecruiterRunByID(ctx context.Context, id primitive.ObjectID) (*models.RecruiterSearchRun, error) {
	var run models.RecruiterSearchRun
	err := s.recruiterSearchRuns.FindOne(ctx, bson.M{"_id": id}).Decode(&run)
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (s *Store) CountUserRecruiterRunsSince(ctx context.Context, userID primitive.ObjectID, since time.Time) (int64, error) {
	return s.recruiterSearchRuns.CountDocuments(ctx, bson.M{
		"requester_user_id": userID,
		"created_at":        bson.M{"$gte": since},
		"status":            bson.M{"$in": []string{models.RecruiterRunCompleted, models.RecruiterRunRunning, models.RecruiterRunQueued}},
	})
}

func (s *Store) CountCompletedUserRecruiterRunsSince(ctx context.Context, userID primitive.ObjectID, since time.Time) (int64, error) {
	return s.recruiterSearchRuns.CountDocuments(ctx, bson.M{
		"requester_user_id": userID,
		"created_at":        bson.M{"$gte": since},
		"status":            models.RecruiterRunCompleted,
	})
}

func (s *Store) LastCompletedRecruiterRunForProfile(ctx context.Context, profileID primitive.ObjectID) (*models.RecruiterSearchRun, error) {
	var run models.RecruiterSearchRun
	opts := options.FindOne().SetSort(bson.D{{Key: "completed_at", Value: -1}})
	err := s.recruiterSearchRuns.FindOne(ctx, bson.M{
		"profile_id": profileID,
		"status":     models.RecruiterRunCompleted,
	}, opts).Decode(&run)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (s *Store) ActiveRecruiterRunByRequesterAndProfile(ctx context.Context, requesterID, profileID primitive.ObjectID) (*models.RecruiterSearchRun, error) {
	var run models.RecruiterSearchRun
	opts := options.FindOne().SetSort(bson.D{{Key: "created_at", Value: -1}})
	err := s.recruiterSearchRuns.FindOne(ctx, bson.M{
		"requester_user_id": requesterID,
		"profile_id":        profileID,
		"status":            bson.M{"$in": []string{models.RecruiterRunQueued, models.RecruiterRunRunning}},
	}, opts).Decode(&run)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (s *Store) FindPendingRecruiterRuns(ctx context.Context) ([]models.RecruiterSearchRun, error) {
	cursor, err := s.recruiterSearchRuns.Find(ctx, bson.M{
		"status": bson.M{"$in": []string{models.RecruiterRunQueued, models.RecruiterRunRunning}},
	}, options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var runs []models.RecruiterSearchRun
	if err := cursor.All(ctx, &runs); err != nil {
		return nil, err
	}
	return runs, nil
}

func (s *Store) ActiveRecruiterRunForProfile(ctx context.Context, profileID primitive.ObjectID) (*models.RecruiterSearchRun, error) {
	var run models.RecruiterSearchRun
	opts := options.FindOne().SetSort(bson.D{{Key: "created_at", Value: -1}})
	err := s.recruiterSearchRuns.FindOne(ctx, bson.M{
		"profile_id": profileID,
		"status":     bson.M{"$in": []string{models.RecruiterRunQueued, models.RecruiterRunRunning}},
	}, opts).Decode(&run)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (s *Store) LastRecruiterRunByRequester(ctx context.Context, userID primitive.ObjectID) (*models.RecruiterSearchRun, error) {
	var run models.RecruiterSearchRun
	opts := options.FindOne().SetSort(bson.D{{Key: "created_at", Value: -1}})
	err := s.recruiterSearchRuns.FindOne(ctx, bson.M{
		"requester_user_id": userID,
		"status":            bson.M{"$in": []string{models.RecruiterRunCompleted, models.RecruiterRunRunning, models.RecruiterRunQueued}},
	}, opts).Decode(&run)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (s *Store) RecruiterEligibility(ctx context.Context, requesterID, profileID primitive.ObjectID, isOwner, unlimited bool) (*models.RecruiterEligibility, error) {
	out := &models.RecruiterEligibility{Eligible: true}
	since := recruiterCooldownSince()

	if isOwner {
		out.Eligible = false
		out.Reason = "Recruiter mode is for evaluating other profiles, not your own"
		return out, nil
	}

	if active, err := s.ActiveRecruiterRunByRequesterAndProfile(ctx, requesterID, profileID); err != nil {
		return nil, err
	} else if active != nil {
		out.Eligible = false
		out.Reason = "Your recruiter deep search is running in the background"
		out.LastRunStatus = active.Status
		out.ActiveRunID = active.ID.Hex()
		return out, nil
	}

	if !unlimited {
		userCount, err := s.CountCompletedUserRecruiterRunsSince(ctx, requesterID, since)
		if err != nil {
			return nil, err
		}
		if userCount >= models.RecruiterWeeklyLimitPerUser {
			out.Eligible = false
			out.Reason = fmt.Sprintf("You have used all %d recruiter deep searches for this week", models.RecruiterWeeklyLimitPerUser)
			lastUser, _ := s.LastRecruiterRunByRequester(ctx, requesterID)
			if lastUser != nil {
				until := lastUser.CreatedAt.Add(time.Duration(models.RecruiterCooldownDays) * 24 * time.Hour)
				out.UserCooldownUntil = &until
			}
			return out, nil
		}

		last, err := s.LastCompletedRecruiterRunForProfile(ctx, profileID)
		if err != nil {
			return nil, err
		}
		if last != nil && last.CompletedAt.After(since) {
			out.Eligible = false
			out.Reason = "This profile was deep-searched recently — try again after the cooldown"
			until := last.CompletedAt.Add(time.Duration(models.RecruiterCooldownDays) * 24 * time.Hour)
			out.ProfileCooldownUntil = &until
			return out, nil
		}
	}

	return out, nil
}
