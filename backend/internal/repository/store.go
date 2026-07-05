package repository

import (
	"context"
	"errors"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var ErrNotFound = errors.New("not found")
var ErrDuplicate = errors.New("duplicate")

type Store struct {
	users               *mongo.Collection
	profiles            *mongo.Collection
	verifications       *mongo.Collection
	scoreSnapshots      *mongo.Collection
	recruiterSearchRuns *mongo.Collection
	recruiterCompanies  *mongo.Collection
	profileSearchEvents *mongo.Collection
	disputes            *mongo.Collection
	newsletter          *mongo.Collection
	salesInquiries      *mongo.Collection
	recruiterSaved      *mongo.Collection
}

func NewStore(db *mongo.Database) *Store {
	return &Store{
		users:               db.Collection("users"),
		profiles:            db.Collection("profiles"),
		verifications:       db.Collection("verifications"),
		scoreSnapshots:      db.Collection("score_snapshots"),
		recruiterSearchRuns: db.Collection("recruiter_search_runs"),
		recruiterCompanies:  db.Collection("recruiter_companies"),
		profileSearchEvents: db.Collection("profile_search_events"),
		disputes:            db.Collection("profile_disputes"),
		newsletter:          db.Collection("newsletter_subscribers"),
		salesInquiries:      db.Collection("sales_inquiries"),
		recruiterSaved:      db.Collection("recruiter_saved_candidates"),
	}
}

func (s *Store) CreateUser(ctx context.Context, user *models.User) error {
	user.CreatedAt = time.Now().UTC()
	user.UpdatedAt = user.CreatedAt
	res, err := s.users.InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrDuplicate
		}
		return err
	}
	user.ID = res.InsertedID.(primitive.ObjectID)
	return nil
}

func (s *Store) FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (s *Store) FindUserByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (s *Store) CreateProfile(ctx context.Context, profile *models.Profile) error {
	profile.CreatedAt = time.Now().UTC()
	profile.UpdatedAt = profile.CreatedAt
	doc, err := profileDocument(profile)
	if err != nil {
		return err
	}
	res, err := s.profiles.InsertOne(ctx, doc)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrDuplicate
		}
		return err
	}
	profile.ID = res.InsertedID.(primitive.ObjectID)
	return nil
}

func (s *Store) UpsertProfileByHandle(ctx context.Context, profile *models.Profile) error {
	now := time.Now().UTC()
	if profile.CreatedAt.IsZero() {
		profile.CreatedAt = now
	}
	profile.UpdatedAt = now
	doc, err := profileDocument(profile)
	if err != nil {
		return err
	}
	opts := options.Replace().SetUpsert(true)
	res, err := s.profiles.ReplaceOne(ctx, bson.M{"handle": profile.Handle}, doc, opts)
	if err != nil {
		return err
	}
	if res.UpsertedID != nil {
		profile.ID = res.UpsertedID.(primitive.ObjectID)
	}
	return nil
}

func (s *Store) DeleteProfileByHandle(ctx context.Context, handle string) error {
	_, err := s.profiles.DeleteOne(ctx, bson.M{"handle": handle})
	return err
}

func profileDocument(profile *models.Profile) (bson.M, error) {
	raw, err := bson.Marshal(profile)
	if err != nil {
		return nil, err
	}
	var doc bson.M
	if err := bson.Unmarshal(raw, &doc); err != nil {
		return nil, err
	}
	if profile.UserID.IsZero() {
		delete(doc, "user_id")
	}
	return doc, nil
}

func (s *Store) UpdateProfile(ctx context.Context, profile *models.Profile) error {
	profile.UpdatedAt = time.Now().UTC()
	doc, err := profileDocument(profile)
	if err != nil {
		return err
	}
	_, err = s.profiles.ReplaceOne(ctx, bson.M{"_id": profile.ID}, doc)
	return err
}

func (s *Store) FindProfileByHandle(ctx context.Context, handle string) (*models.Profile, error) {
	var profile models.Profile
	err := s.profiles.FindOne(ctx, bson.M{"handle": handle}).Decode(&profile)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &profile, nil
}

func (s *Store) FindProfileByID(ctx context.Context, id primitive.ObjectID) (*models.Profile, error) {
	var profile models.Profile
	err := s.profiles.FindOne(ctx, bson.M{"_id": id}).Decode(&profile)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &profile, nil
}

func (s *Store) FindProfileByUserID(ctx context.Context, userID primitive.ObjectID) (*models.Profile, error) {
	var profile models.Profile
	err := s.profiles.FindOne(ctx, bson.M{"user_id": userID}).Decode(&profile)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &profile, nil
}

func (s *Store) ListProfiles(ctx context.Context, limit int64) ([]models.Profile, error) {
	opts := options.Find().SetLimit(limit).SetSort(bson.D{{Key: "trust_score.overall", Value: -1}})
	cursor, err := s.profiles.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []models.Profile
	if err := cursor.All(ctx, &profiles); err != nil {
		return nil, err
	}
	return profiles, nil
}

func (s *Store) CountProfiles(ctx context.Context) (int64, error) {
	return s.profiles.CountDocuments(ctx, bson.M{})
}
