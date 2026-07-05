package database

import (
	"context"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func Connect(ctx context.Context, uri string) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	return client, nil
}

func EnsureIndexes(ctx context.Context, db *mongo.Database) error {
	profiles := db.Collection("profiles")
	users := db.Collection("users")

	// Drop legacy auto-named indexes from the initial schema.
	for _, name := range []string{"handle_1", "user_id_1", "profiles_user_id_unique"} {
		_, _ = profiles.Indexes().DropOne(ctx, name)
	}
	_, _ = users.Indexes().DropOne(ctx, "email_1")

	if err := ensureIndexes(ctx, db.Collection("verifications"), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "token", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("verifications_token_unique"),
		},
		{
			Keys:    bson.D{{Key: "profile_id", Value: 1}},
			Options: options.Index().SetName("verifications_profile_id"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, profiles, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "handle", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("profiles_handle_unique"),
		},
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true).SetName("profiles_user_id_unique"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, users, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true).SetName("users_email_unique"),
		},
		{
			Keys:    bson.D{{Key: "clerk_id", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true).SetName("users_clerk_id_unique"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, db.Collection("profile_disputes"), []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "profile_id", Value: 1},
				{Key: "reporter_user_id", Value: 1},
				{Key: "status", Value: 1},
			},
			Options: options.Index().SetName("disputes_profile_reporter_status"),
		},
		{
			Keys:    bson.D{{Key: "status", Value: 1}, {Key: "created_at", Value: -1}},
			Options: options.Index().SetName("disputes_status_created"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, db.Collection("sales_inquiries"), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "created_at", Value: -1}},
			Options: options.Index().SetName("sales_inquiries_created_at"),
		},
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetName("sales_inquiries_email"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, db.Collection("newsletter_subscribers"), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("newsletter_email_unique"),
		},
		{
			Keys:    bson.D{{Key: "created_at", Value: -1}},
			Options: options.Index().SetName("newsletter_created_at"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, db.Collection("recruiter_companies"), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "linkedin_url", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true).SetName("recruiter_companies_linkedin_unique"),
		},
		{
			Keys:    bson.D{{Key: "website_url", Value: 1}},
			Options: options.Index().SetSparse(true).SetName("recruiter_companies_website"),
		},
		{
			Keys:    bson.D{{Key: "created_by", Value: 1}, {Key: "created_at", Value: -1}},
			Options: options.Index().SetName("recruiter_companies_created_by"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, db.Collection("profile_search_events"), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "searcher_user_id", Value: 1}, {Key: "created_at", Value: -1}},
			Options: options.Index().SetName("profile_search_searcher_created"),
		},
		{
			Keys:    bson.D{{Key: "profile_handle", Value: 1}, {Key: "created_at", Value: -1}},
			Options: options.Index().SetName("profile_search_handle_created"),
		},
	}); err != nil {
		return err
	}

	if err := ensureIndexes(ctx, db.Collection("recruiter_saved_candidates"), []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "recruiter_user_id", Value: 1},
				{Key: "profile_handle", Value: 1},
			},
			Options: options.Index().SetUnique(true).SetName("recruiter_saved_user_handle_unique"),
		},
		{
			Keys:    bson.D{{Key: "recruiter_user_id", Value: 1}, {Key: "created_at", Value: -1}},
			Options: options.Index().SetName("recruiter_saved_user_created"),
		},
	}); err != nil {
		return err
	}

	return ensureIndexes(ctx, db.Collection("recruiter_search_runs"), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "requester_user_id", Value: 1}, {Key: "created_at", Value: -1}},
			Options: options.Index().SetName("recruiter_runs_requester_created"),
		},
		{
			Keys:    bson.D{{Key: "profile_id", Value: 1}, {Key: "completed_at", Value: -1}},
			Options: options.Index().SetName("recruiter_runs_profile_completed"),
		},
		{
			Keys:    bson.D{{Key: "profile_id", Value: 1}, {Key: "status", Value: 1}},
			Options: options.Index().SetName("recruiter_runs_profile_status"),
		},
	})
}

func ensureIndexes(ctx context.Context, coll *mongo.Collection, models []mongo.IndexModel) error {
	for _, model := range models {
		if _, err := coll.Indexes().CreateOne(ctx, model); err == nil {
			continue
		} else if isIndexConflict(err) && model.Options.Name != nil {
			_, _ = coll.Indexes().DropOne(ctx, *model.Options.Name)
			if _, err = coll.Indexes().CreateOne(ctx, model); err != nil {
				return err
			}
		} else if !isIndexExists(err) {
			return err
		}
	}
	return nil
}

func isIndexConflict(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "IndexKeySpecsConflict") ||
		strings.Contains(msg, "IndexOptionsConflict") ||
		strings.Contains(msg, "already exists with a different name")
}

func isIndexExists(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "already exists") || strings.Contains(msg, "IndexAlreadyExists")
}
