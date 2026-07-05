package repository

import (
	"context"

	"github.com/trustgraph/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AdminStats struct {
	Users          int64 `json:"users"`
	Profiles       int64 `json:"profiles"`
	ShadowProfiles int64 `json:"shadow_profiles"`
	ClaimedProfiles int64 `json:"claimed_profiles"`
	ProUsers       int64 `json:"pro_users"`
	PrivateProfiles int64 `json:"private_profiles"`
}

type AdminProfileRow struct {
	Handle          string  `json:"handle"`
	DisplayName     string  `json:"display_name"`
	TrustScore      float64 `json:"trust_score"`
	EvidenceCount   int     `json:"evidence_count"`
	IsShadow        bool    `json:"is_shadow"`
	IsClaimed       bool    `json:"is_claimed"`
	IsPrivate       bool    `json:"is_private"`
	OnboardingStep  int     `json:"onboarding_step"`
	HasUser         bool    `json:"has_user"`
}

type AdminUserRow struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Plan      string `json:"plan"`
	Handle    string `json:"handle,omitempty"`
	CreatedAt string `json:"created_at"`
}

func (s *Store) AdminStats(ctx context.Context) (AdminStats, error) {
	var stats AdminStats
	var err error

	stats.Users, err = s.users.CountDocuments(ctx, bson.M{})
	if err != nil {
		return stats, err
	}
	stats.Profiles, err = s.profiles.CountDocuments(ctx, bson.M{})
	if err != nil {
		return stats, err
	}
	stats.ShadowProfiles, err = s.profiles.CountDocuments(ctx, bson.M{"is_shadow": true})
	if err != nil {
		return stats, err
	}
	stats.ClaimedProfiles, err = s.profiles.CountDocuments(ctx, bson.M{"is_claimed": true})
	if err != nil {
		return stats, err
	}
	stats.ProUsers, err = s.users.CountDocuments(ctx, bson.M{"plan": "pro"})
	if err != nil {
		return stats, err
	}
	stats.PrivateProfiles, err = s.profiles.CountDocuments(ctx, bson.M{"is_private": true})
	if err != nil {
		return stats, err
	}
	return stats, nil
}

func (s *Store) ListProfilesAdmin(ctx context.Context, limit, skip int64) ([]AdminProfileRow, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "updated_at", Value: -1}}).
		SetLimit(limit).
		SetSkip(skip)

	cur, err := s.profiles.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	rows := make([]AdminProfileRow, 0)
	for cur.Next(ctx) {
		var p models.Profile
		if err := cur.Decode(&p); err != nil {
			continue
		}
		rows = append(rows, AdminProfileRow{
			Handle:         p.Handle,
			DisplayName:    p.DisplayName,
			TrustScore:     p.TrustScore.Overall,
			EvidenceCount:  len(p.Evidence),
			IsShadow:       p.IsShadow,
			IsClaimed:      p.IsClaimed,
			IsPrivate:      p.IsPrivate,
			OnboardingStep: p.OnboardingStep,
			HasUser:        !p.UserID.IsZero(),
		})
	}
	return rows, cur.Err()
}

func (s *Store) ListUsersAdmin(ctx context.Context, limit, skip int64) ([]AdminUserRow, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(limit).
		SetSkip(skip)

	cur, err := s.users.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	rows := make([]AdminUserRow, 0)
	for cur.Next(ctx) {
		var u models.User
		if err := cur.Decode(&u); err != nil {
			continue
		}
		row := AdminUserRow{
			ID:        u.ID.Hex(),
			Email:     u.Email,
			Name:      u.Name,
			Plan:      u.Plan,
			CreatedAt: u.CreatedAt.Format("2006-01-02"),
		}
		if profile, err := s.FindProfileByUserID(ctx, u.ID); err == nil {
			row.Handle = profile.Handle
		}
		rows = append(rows, row)
	}
	return rows, cur.Err()
}
