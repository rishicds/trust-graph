package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (s *Store) CreateVerification(ctx context.Context, req *models.VerificationRequest) error {
	req.CreatedAt = time.Now().UTC()
	if req.Token == "" {
		req.Token = randomToken()
	}
	if req.Status == "" {
		req.Status = "pending"
	}
	if req.ExpiresAt.IsZero() {
		req.ExpiresAt = time.Now().UTC().Add(14 * 24 * time.Hour)
	}
	res, err := s.verifications.InsertOne(ctx, req)
	if err != nil {
		return err
	}
	req.ID = res.InsertedID.(primitive.ObjectID)
	return nil
}

func (s *Store) FindVerificationByToken(ctx context.Context, token string) (*models.VerificationRequest, error) {
	var req models.VerificationRequest
	err := s.verifications.FindOne(ctx, bson.M{"token": token, "status": "pending"}).Decode(&req)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if time.Now().After(req.ExpiresAt) {
		return nil, ErrNotFound
	}
	return &req, nil
}

func (s *Store) ConfirmVerification(ctx context.Context, req *models.VerificationRequest) error {
	req.Status = "confirmed"
	_, err := s.verifications.ReplaceOne(ctx, bson.M{"_id": req.ID}, req)
	return err
}

func (s *Store) ListVerificationsByProfile(ctx context.Context, profileID primitive.ObjectID) ([]models.VerificationRequest, error) {
	cursor, err := s.verifications.Find(ctx, bson.M{"profile_id": profileID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var items []models.VerificationRequest
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (s *Store) SaveScoreSnapshot(ctx context.Context, profileID primitive.ObjectID, score models.TrustScore) error {
	_, err := s.scoreSnapshots.InsertOne(ctx, bson.M{
		"profile_id": profileID,
		"overall":    score.Overall,
		"dimensions": score.Dimensions,
		"recorded_at": time.Now().UTC(),
	})
	return err
}

func (s *Store) ScorePercentile(ctx context.Context, dimension string, value float64) (float64, error) {
	field := "trust_score.overall"
	switch dimension {
	case "evidence_depth":
		field = "trust_score.dimensions.evidence_depth"
	case "consistency":
		field = "trust_score.dimensions.consistency"
	case "peer_verification":
		field = "trust_score.dimensions.peer_verification"
	case "trust_ratio":
		field = "trust_score.dimensions.trust_ratio"
	case "impact_signals":
		field = "trust_score.dimensions.impact_signals"
	}

	total, err := s.profiles.CountDocuments(ctx, bson.M{})
	if err != nil || total == 0 {
		return 50, err
	}

	below, err := s.profiles.CountDocuments(ctx, bson.M{field: bson.M{"$lt": value}})
	if err != nil {
		return 50, err
	}
	return float64(below) / float64(total) * 100, nil
}

func randomToken() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
