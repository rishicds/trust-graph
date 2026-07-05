package repository

import (
	"context"
	"strings"
	"time"

	"github.com/trustgraph/backend/internal/models"
	"github.com/trustgraph/backend/internal/service"
	"github.com/trustgraph/backend/internal/service/profilesync"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func (s *Store) UpdateUserFields(ctx context.Context, userID primitive.ObjectID, set bson.M) error {
	if set == nil {
		return nil
	}
	set["updated_at"] = time.Now().UTC()
	_, err := s.users.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{"$set": set})
	return err
}

func (s *Store) CreatePassportProfileForUser(ctx context.Context, user *models.User, identity ClerkIdentity, preferredHandle string) (*models.Profile, error) {
	existing, err := s.FindProfileByUserID(ctx, user.ID)
	if err == nil {
		return existing, nil
	}
	if err != ErrNotFound {
		return nil, err
	}

	handle := sanitizeHandle(preferredHandle, identity)
	now := time.Now().UTC()
	profile := &models.Profile{
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
			handle = handle + "-" + strings.TrimPrefix(user.ID.Hex(), "00000000000000000000")[:4]
			profile.Handle = handle
			if err := s.CreateProfile(ctx, profile); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	return profile, nil
}

func (s *Store) FindRecruiterCompanyByURL(ctx context.Context, linkedInURL, websiteURL string) (*models.RecruiterCompany, error) {
	linkedInURL = normalizeCompanyURL(linkedInURL)
	websiteURL = normalizeCompanyURL(websiteURL)
	filter := bson.M{}
	switch {
	case linkedInURL != "":
		filter["linkedin_url"] = linkedInURL
	case websiteURL != "":
		filter["website_url"] = websiteURL
	default:
		return nil, ErrNotFound
	}

	var company models.RecruiterCompany
	err := s.recruiterCompanies.FindOne(ctx, filter).Decode(&company)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &company, nil
}

func (s *Store) FindRecruiterCompanyByID(ctx context.Context, id primitive.ObjectID) (*models.RecruiterCompany, error) {
	var company models.RecruiterCompany
	err := s.recruiterCompanies.FindOne(ctx, bson.M{"_id": id}).Decode(&company)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &company, nil
}

func (s *Store) UpsertRecruiterCompany(ctx context.Context, company *models.RecruiterCompany) error {
	now := time.Now().UTC()
	company.LinkedInURL = normalizeCompanyURL(company.LinkedInURL)
	company.WebsiteURL = normalizeCompanyURL(company.WebsiteURL)
	if company.CreatedAt.IsZero() {
		company.CreatedAt = now
	}
	company.UpdatedAt = now

	if company.ID.IsZero() {
		if existing, err := s.FindRecruiterCompanyByURL(ctx, company.LinkedInURL, company.WebsiteURL); err == nil {
			company.ID = existing.ID
			if company.CreatedAt.IsZero() {
				company.CreatedAt = existing.CreatedAt
			}
		}
	}

	if company.ID.IsZero() {
		res, err := s.recruiterCompanies.InsertOne(ctx, company)
		if err != nil {
			return err
		}
		company.ID = res.InsertedID.(primitive.ObjectID)
		return nil
	}

	_, err := s.recruiterCompanies.ReplaceOne(ctx, bson.M{"_id": company.ID}, company)
	return err
}

func (s *Store) FindRecruiterCompanyByCreator(ctx context.Context, userID primitive.ObjectID) (*models.RecruiterCompany, error) {
	var company models.RecruiterCompany
	err := s.recruiterCompanies.FindOne(ctx,
		bson.M{"created_by": userID},
		options.FindOne().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	).Decode(&company)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &company, nil
}

func (s *Store) ResolveRecruiterCompanyForUser(ctx context.Context, user *models.User) (*models.RecruiterCompany, error) {
	if user == nil {
		return nil, ErrNotFound
	}
	if !user.RecruiterCompanyID.IsZero() {
		if company, err := s.FindRecruiterCompanyByID(ctx, user.RecruiterCompanyID); err == nil {
			return company, nil
		}
	}
	company, err := s.FindRecruiterCompanyByCreator(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	if user.RecruiterCompanyID != company.ID {
		_ = s.UpdateUserFields(ctx, user.ID, bson.M{"recruiter_company_id": company.ID})
	}
	return company, nil
}

func (s *Store) SearchProfilesText(ctx context.Context, query string, limit int64) ([]models.Profile, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, nil
	}
	if limit <= 0 {
		limit = 12
	}

	pattern := primitive.Regex{Pattern: escapeRegex(query), Options: "i"}
	filter := bson.M{
		"$or": []bson.M{
			{"handle": pattern},
			{"display_name": pattern},
			{"headline": pattern},
			{"capabilities.name": pattern},
			{"evidence.title": pattern},
			{"evidence.description": pattern},
			{"ai_insight.summary": pattern},
			{"ai_insight.highlights": pattern},
			{"ai_insight.role_signals": pattern},
			{"enriched_sources.title": pattern},
			{"enriched_sources.snippet": pattern},
			{"timeline.label": pattern},
		},
	}

	cursor, err := s.profiles.Find(ctx, filter, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "trust_score.overall", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []models.Profile
	return profiles, cursor.All(ctx, &profiles)
}

func (s *Store) SearchProfilesByTokens(ctx context.Context, tokens []string, limit int64) ([]models.Profile, error) {
	if len(tokens) == 0 {
		return nil, nil
	}
	if limit <= 0 {
		limit = 20
	}

	or := make([]bson.M, 0, len(tokens)*4)
	for _, tok := range tokens {
		if strings.TrimSpace(tok) == "" {
			continue
		}
		pattern := primitive.Regex{Pattern: escapeRegex(tok), Options: "i"}
		or = append(or,
			bson.M{"handle": pattern},
			bson.M{"display_name": pattern},
			bson.M{"headline": pattern},
			bson.M{"capabilities.name": pattern},
			bson.M{"evidence.title": pattern},
			bson.M{"evidence.description": pattern},
			bson.M{"ai_insight.summary": pattern},
			bson.M{"ai_insight.highlights": pattern},
			bson.M{"ai_insight.role_signals": pattern},
			bson.M{"enriched_sources.title": pattern},
			bson.M{"enriched_sources.snippet": pattern},
			bson.M{"timeline.label": pattern},
		)
	}
	if len(or) == 0 {
		return nil, nil
	}

	cursor, err := s.profiles.Find(ctx, bson.M{"$or": or}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "trust_score.overall", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []models.Profile
	return profiles, cursor.All(ctx, &profiles)
}

func normalizeCompanyURL(raw string) string {
	raw = strings.TrimSpace(strings.ToLower(raw))
	raw = strings.TrimSuffix(raw, "/")
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	return "https://" + raw
}

func escapeRegex(input string) string {
	replacer := strings.NewReplacer(
		`\`, `\\`, `.`, `\.`, `*`, `\*`, `+`, `\+`, `?`, `\?`,
		`(`, `\(`, `)`, `\)`, `[`, `\[`, `]`, `\]`, `{`, `\{`, `}`, `\}`,
		`^`, `\^`, `$`, `\$`, `|`, `\|`,
	)
	return replacer.Replace(input)
}
