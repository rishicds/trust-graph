package repository

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service"
	"github.com/trustgraph/backend/internal/service/profilesync"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var handleSanitizer = regexp.MustCompile(`[^a-z0-9-]+`)

func (s *Store) FindUserByClerkID(ctx context.Context, clerkID string) (*models.User, error) {
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"clerk_id": clerkID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

type ClerkIdentity struct {
	ClerkID   string
	Email     string
	Name      string
	AvatarURL string
}

func (s *Store) EnsureClerkUser(ctx context.Context, identity ClerkIdentity, handle string) (*models.User, *models.Profile, error) {
	if identity.ClerkID == "" {
		return nil, nil, fmt.Errorf("clerk id required")
	}

	user, err := s.FindUserByClerkID(ctx, identity.ClerkID)
	if err != nil && err != ErrNotFound {
		return nil, nil, err
	}

	if user == nil && identity.Email != "" {
		user, _ = s.FindUserByEmail(ctx, strings.ToLower(identity.Email))
		if user != nil && user.ClerkID == "" {
			user.ClerkID = identity.ClerkID
			user.UpdatedAt = time.Now().UTC()
			if user.Name == "" && identity.Name != "" {
				user.Name = identity.Name
			}
			_, err = s.users.ReplaceOne(ctx, bson.M{"_id": user.ID}, user)
			if err != nil {
				return nil, nil, err
			}
		}
	}

	if user == nil {
		user = &models.User{
			ClerkID:            identity.ClerkID,
			Email:              strings.ToLower(identity.Email),
			Name:               identity.Name,
			EmailDigestEnabled: true,
		}
		if err := s.CreateUser(ctx, user); err != nil {
			return nil, nil, err
		}
	}

	profile, err := s.FindProfileByUserID(ctx, user.ID)
	if err != nil && err != ErrNotFound {
		return nil, nil, err
	}

	if profile != nil {
		updated := false
		if profile.AvatarURL == "" && identity.AvatarURL != "" {
			profile.AvatarURL = identity.AvatarURL
			updated = true
		}
		if updated {
			_ = s.UpdateProfile(ctx, profile)
		}
		return user, profile, nil
	}

	claimHandle := strings.TrimSpace(strings.ToLower(handle))
	if claimHandle != "" {
		shadow, shadowErr := s.FindProfileByHandle(ctx, claimHandle)
		if shadowErr == nil && shadow.IsShadow && !shadow.IsClaimed {
			return user, nil, nil
		}
	}

	// Defer passport profile creation until the user picks a professional segment.
	if user.AccountType == "recruiter" || user.AccountType == "" {
		return user, nil, nil
	}
	if user.AccountType == "passport" && user.ProfessionalSegment == "" {
		return user, nil, nil
	}

	handle = sanitizeHandle(handle, identity)
	now := time.Now().UTC()
	profile = &models.Profile{
		UserID:         user.ID,
		Handle:         handle,
		DisplayName:    identity.Name,
		AvatarURL:      identity.AvatarURL,
		IsClaimed:      true,
		OnboardingStep: 1,
		ActiveSince:    now,
		LastActivityAt: now,
	}
	profile.TrustScore = service.ComputeTrustScore(profile)
	profilesync.FinalizeProfileMetrics(profile)

	if err := s.CreateProfile(ctx, profile); err != nil {
		if err == ErrDuplicate {
			handle = fmt.Sprintf("%s-%d", handle, time.Now().Unix()%10000)
			profile.Handle = handle
			if err := s.CreateProfile(ctx, profile); err != nil {
				return nil, nil, err
			}
		} else {
			return nil, nil, err
		}
	}

	return user, profile, nil
}

func sanitizeHandle(preferred string, identity ClerkIdentity) string {
	handle := strings.TrimSpace(strings.ToLower(preferred))
	handle = handleSanitizer.ReplaceAllString(handle, "-")
	handle = strings.Trim(handle, "-")
	if len(handle) >= 3 {
		return handle
	}

	base := identity.ClerkID
	if identity.Email != "" {
		base = strings.Split(identity.Email, "@")[0]
	}
	handle = handleSanitizer.ReplaceAllString(strings.ToLower(base), "-")
	handle = strings.Trim(handle, "-")
	if len(handle) < 3 {
		handle = "user-" + identity.ClerkID[len(identity.ClerkID)-6:]
	}
	if len(handle) > 30 {
		handle = handle[:30]
	}
	return strings.Trim(handle, "-")
}
