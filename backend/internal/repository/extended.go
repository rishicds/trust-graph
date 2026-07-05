package repository

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func (s *Store) ListConnectedProfiles(ctx context.Context, platform string) ([]models.Profile, error) {
	cursor, err := s.profiles.Find(ctx, bson.M{
		"data_sources": bson.M{
			"$elemMatch": bson.M{"platform": platform, "connected": true},
		},
		"is_claimed": true,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var profiles []models.Profile
	return profiles, cursor.All(ctx, &profiles)
}

func (s *Store) ListDigestUsers(ctx context.Context) ([]models.User, error) {
	weekAgo := time.Now().UTC().Add(-7 * 24 * time.Hour)
	cursor, err := s.users.Find(ctx, bson.M{
		"email_digest_enabled": true,
		"email":                bson.M{"$ne": ""},
		"$or": []bson.M{
			{"last_digest_at": bson.M{"$exists": false}},
			{"last_digest_at": bson.M{"$lt": weekAgo}},
		},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var users []models.User
	return users, cursor.All(ctx, &users)
}

func (s *Store) MarkDigestSent(ctx context.Context, userID primitive.ObjectID) error {
	_, err := s.users.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$set": bson.M{"last_digest_at": time.Now().UTC()},
	})
	return err
}

func (s *Store) UpdateUserPlan(ctx context.Context, userID primitive.ObjectID, plan, stripeCustomerID string) error {
	set := bson.M{"plan": plan, "updated_at": time.Now().UTC()}
	if stripeCustomerID != "" {
		set["stripe_customer_id"] = stripeCustomerID
	}
	_, err := s.users.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$set": set})
	return err
}

func (s *Store) FindUserByStripeCustomer(ctx context.Context, customerID string) (*models.User, error) {
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"stripe_customer_id": customerID}).Decode(&user)
	if err != nil {
		return nil, ErrNotFound
	}
	return &user, nil
}

func (s *Store) GenerateAPIKey(ctx context.Context, userID primitive.ObjectID) (string, error) {
	buf := make([]byte, 24)
	_, _ = rand.Read(buf)
	raw := "tg_" + hex.EncodeToString(buf)
	hash := sha256.Sum256([]byte(raw))
	_, err := s.users.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$set": bson.M{
			"api_key_hash": hex.EncodeToString(hash[:]),
			"updated_at":   time.Now().UTC(),
		},
	})
	if err != nil {
		return "", err
	}
	return raw, nil
}

func (s *Store) FindUserByAPIKey(ctx context.Context, rawKey string) (*models.User, error) {
	hash := sha256.Sum256([]byte(rawKey))
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"api_key_hash": hex.EncodeToString(hash[:])}).Decode(&user)
	if err != nil {
		return nil, ErrNotFound
	}
	return &user, nil
}

func (s *Store) UpdateProfileSettings(ctx context.Context, profile *models.Profile) error {
	return s.UpdateProfile(ctx, profile)
}

func (s *Store) DeleteUserAccount(ctx context.Context, userID primitive.ObjectID) error {
	_, _ = s.profiles.DeleteMany(ctx, bson.M{"user_id": userID})
	_, _ = s.verifications.DeleteMany(ctx, bson.M{"requester_id": userID})
	_, err := s.users.DeleteOne(ctx, bson.M{"_id": userID})
	return err
}

func (s *Store) ListScoreHistory(ctx context.Context, profileID primitive.ObjectID, limit int64) ([]models.ScoreSnapshot, error) {
	opts := options.Find().SetSort(bson.D{{Key: "recorded_at", Value: -1}}).SetLimit(limit)
	cursor, err := s.scoreSnapshots.Find(ctx, bson.M{"profile_id": profileID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var items []models.ScoreSnapshot
	for cursor.Next(ctx) {
		var raw bson.M
		if err := cursor.Decode(&raw); err != nil {
			continue
		}
		item := models.ScoreSnapshot{ProfileID: profileID}
		if v, ok := raw["overall"].(float64); ok {
			item.Overall = v
		}
		if t, ok := raw["recorded_at"].(primitive.DateTime); ok {
			item.RecordedAt = t.Time()
		}
		items = append(items, item)
	}
	return items, nil
}

func (s *Store) DispatchWebhook(ctx context.Context, profile *models.Profile) error {
	if profile.WebhookURL == "" {
		return nil
	}
	payload := map[string]interface{}{
		"handle":      profile.Handle,
		"score":       profile.TrustScore.Overall,
		"delta":       profile.TrustScore.Delta,
		"recorded_at": time.Now().UTC(),
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, profile.WebhookURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	return nil
}

func (s *Store) UpdateUserSettings(ctx context.Context, userID primitive.ObjectID, digestEnabled bool) error {
	_, err := s.users.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$set": bson.M{
			"email_digest_enabled": digestEnabled,
			"updated_at":           time.Now().UTC(),
		},
	})
	return err
}
