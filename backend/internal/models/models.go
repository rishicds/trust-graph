package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID                        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ClerkID                   string             `bson:"clerk_id,omitempty" json:"clerk_id,omitempty"`
	Email                     string             `bson:"email" json:"email"`
	PasswordHash              string             `bson:"password_hash,omitempty" json:"-"`
	Name                      string             `bson:"name" json:"name"`
	Plan                      string             `bson:"plan,omitempty" json:"plan"`
	AccountType               string             `bson:"account_type,omitempty" json:"account_type,omitempty"`
	ProfessionalSegment       string             `bson:"professional_segment,omitempty" json:"professional_segment,omitempty"`
	HiringSegment             string             `bson:"hiring_segment,omitempty" json:"hiring_segment,omitempty"`
	RecruiterOnboardingComplete bool             `bson:"recruiter_onboarding_complete" json:"recruiter_onboarding_complete"`
	RecruiterCompanyID        primitive.ObjectID `bson:"recruiter_company_id,omitempty" json:"recruiter_company_id,omitempty"`
	CompanyEmail              string             `bson:"company_email,omitempty" json:"company_email,omitempty"`
	StripeCustomerID          string             `bson:"stripe_customer_id,omitempty" json:"-"`
	APIKeyHash                string             `bson:"api_key_hash,omitempty" json:"-"`
	EmailDigestEnabled        bool               `bson:"email_digest_enabled" json:"email_digest_enabled"`
	LastDigestAt              time.Time          `bson:"last_digest_at,omitempty" json:"last_digest_at,omitempty"`
	CreatedAt                 time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt                 time.Time          `bson:"updated_at" json:"updated_at"`
}

type RecruiterCompany struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name          string             `bson:"name" json:"name"`
	Email         string             `bson:"email,omitempty" json:"email,omitempty"`
	LinkedInURL   string             `bson:"linkedin_url,omitempty" json:"linkedin_url,omitempty"`
	WebsiteURL    string             `bson:"website_url,omitempty" json:"website_url,omitempty"`
	LogoURL       string             `bson:"logo_url,omitempty" json:"logo_url,omitempty"`
	Industry      string             `bson:"industry,omitempty" json:"industry,omitempty"`
	Size          string             `bson:"size,omitempty" json:"size,omitempty"`
	Description   string             `bson:"description,omitempty" json:"description,omitempty"`
	Location      string             `bson:"location,omitempty" json:"location,omitempty"`
	EmployeeCount string             `bson:"employee_count,omitempty" json:"employee_count,omitempty"`
	CreatedBy     primitive.ObjectID `bson:"created_by,omitempty" json:"created_by,omitempty"`
	ScrapedAt     time.Time          `bson:"scraped_at,omitempty" json:"scraped_at,omitempty"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

type ProfileSearchEvent struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SearcherUserID primitive.ObjectID `bson:"searcher_user_id" json:"searcher_user_id"`
	SearcherType   string             `bson:"searcher_type" json:"searcher_type"`
	Query          string             `bson:"query,omitempty" json:"query,omitempty"`
	ProfileID      primitive.ObjectID `bson:"profile_id" json:"profile_id"`
	ProfileHandle  string             `bson:"profile_handle" json:"profile_handle"`
	Source         string             `bson:"source" json:"source"`
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
}

type CandidateSearchResult struct {
	Handle           string        `json:"handle"`
	DisplayName      string        `json:"display_name"`
	Headline         string        `json:"headline,omitempty"`
	AvatarURL        string        `json:"avatar_url,omitempty"`
	TrustScore       TrustScore    `json:"trust_score"`
	Capabilities     []Capability  `json:"capabilities,omitempty"`
	EvidenceCount    int           `json:"evidence_count"`
	MatchReason      string        `json:"match_reason,omitempty"`
	MatchSummary     string        `json:"match_summary,omitempty"`
	MatchHighlights  []string      `json:"match_highlights,omitempty"`
	MatchedSignals   []MatchSignal `json:"matched_signals,omitempty"`
	RelevanceScore   float64       `json:"relevance_score"`
	AISummary        string        `json:"ai_summary,omitempty"`
	IsShadow         bool          `json:"is_shadow"`
	DiscoverySource  string        `json:"discovery_source,omitempty"`
	Starred          bool          `json:"starred,omitempty"`
}

type MatchSignal struct {
	Category string  `json:"category"`
	Label    string  `json:"label"`
	Detail   string  `json:"detail"`
	Source   string  `json:"source,omitempty"`
	URL      string  `json:"url,omitempty"`
	Weight   float64 `json:"weight,omitempty"`
}

type DataSource struct {
	Platform   string    `bson:"platform" json:"platform"`
	ExternalID string    `bson:"external_id" json:"external_id"`
	Connected  bool      `bson:"connected" json:"connected"`
	ConnectedAt time.Time `bson:"connected_at,omitempty" json:"connected_at,omitempty"`
}

type SocialLink struct {
	Platform string `bson:"platform" json:"platform"`
	URL      string `bson:"url" json:"url"`
}

type EnrichedSource struct {
	Platform  string    `bson:"platform" json:"platform"`
	URL       string    `bson:"url" json:"url"`
	Title     string    `bson:"title,omitempty" json:"title,omitempty"`
	Snippet   string    `bson:"snippet,omitempty" json:"snippet,omitempty"`
	ScrapedAt time.Time `bson:"scraped_at" json:"scraped_at"`
	Error     string    `bson:"error,omitempty" json:"error,omitempty"`
}

type ProfileInsight struct {
	Summary                  string    `bson:"summary" json:"summary"`
	Highlights               []string  `bson:"highlights,omitempty" json:"highlights,omitempty"`
	RoleSignals              []string  `bson:"role_signals,omitempty" json:"role_signals,omitempty"`
	CrossPlatformConsistency string    `bson:"cross_platform_consistency,omitempty" json:"cross_platform_consistency,omitempty"`
	Gaps                     []string  `bson:"gaps,omitempty" json:"gaps,omitempty"`
	SourceURLs               []string  `bson:"source_urls,omitempty" json:"source_urls,omitempty"`
	Model                    string    `bson:"model,omitempty" json:"model,omitempty"`
	GeneratedAt              time.Time `bson:"generated_at" json:"generated_at"`
}

type EvidenceItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type        string             `bson:"type" json:"type"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	URL         string             `bson:"url,omitempty" json:"url,omitempty"`
	Platform    string             `bson:"platform" json:"platform"`
	Verified    bool               `bson:"verified" json:"verified"`
	Count       int                `bson:"count,omitempty" json:"count,omitempty"`
	OccurredAt  time.Time          `bson:"occurred_at" json:"occurred_at"`
}

type ScoreDimensions struct {
	EvidenceDepth    float64 `bson:"evidence_depth" json:"evidence_depth"`
	Consistency      float64 `bson:"consistency" json:"consistency"`
	PeerVerification float64 `bson:"peer_verification" json:"peer_verification"`
	ImpactSignals    float64 `bson:"impact_signals" json:"impact_signals"`
	TrustRatio       float64 `bson:"trust_ratio,omitempty" json:"trust_ratio,omitempty"`
}

type TrustScore struct {
	Overall    float64         `bson:"overall" json:"overall"`
	Dimensions ScoreDimensions `bson:"dimensions" json:"dimensions"`
	Delta      float64         `bson:"delta" json:"delta"`
	UpdatedAt  time.Time       `bson:"updated_at" json:"updated_at"`
	Positive   []string        `bson:"positive_signals,omitempty" json:"positive_signals,omitempty"`
	Negative   []string        `bson:"negative_signals,omitempty" json:"negative_signals,omitempty"`
}

type Capability struct {
	Name     string `bson:"name" json:"name"`
	Evidence int    `bson:"evidence_count" json:"evidence_count"`
	Verified bool   `bson:"verified" json:"verified"`
}

type Profile struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID          primitive.ObjectID `bson:"user_id,omitempty" json:"user_id,omitempty"`
	Handle          string             `bson:"handle" json:"handle"`
	DisplayName     string             `bson:"display_name" json:"display_name"`
	Headline        string             `bson:"headline,omitempty" json:"headline,omitempty"`
	AvatarURL       string             `bson:"avatar_url,omitempty" json:"avatar_url,omitempty"`
	IsShadow        bool               `bson:"is_shadow" json:"is_shadow"`
	IsClaimed       bool               `bson:"is_claimed" json:"is_claimed"`
	IsPrivate            bool               `bson:"is_private" json:"is_private"`
	PublicBreakdown      bool               `bson:"public_breakdown" json:"public_breakdown"`
	WebhookURL           string             `bson:"webhook_url,omitempty" json:"webhook_url,omitempty"`
	EstimatedScoreMin    float64            `bson:"estimated_score_min,omitempty" json:"estimated_score_min,omitempty"`
	EstimatedScoreMax    float64            `bson:"estimated_score_max,omitempty" json:"estimated_score_max,omitempty"`
	ProfileCompleteness  float64            `bson:"profile_completeness,omitempty" json:"profile_completeness,omitempty"`
	OnboardingStep       int                `bson:"onboarding_step" json:"onboarding_step"`
	DataSources     []DataSource       `bson:"data_sources" json:"data_sources"`
	SocialLinks     []SocialLink       `bson:"social_links,omitempty" json:"social_links,omitempty"`
	GitHubPublicEmail string           `bson:"github_public_email,omitempty" json:"github_public_email,omitempty"`
	AIInsight       *ProfileInsight    `bson:"ai_insight,omitempty" json:"ai_insight,omitempty"`
	RecruiterReport *RecruiterReport   `bson:"recruiter_report,omitempty" json:"recruiter_report,omitempty"`
	LastRecruiterSearchAt time.Time    `bson:"last_recruiter_search_at,omitempty" json:"last_recruiter_search_at,omitempty"`
	EnrichedSources []EnrichedSource   `bson:"enriched_sources,omitempty" json:"enriched_sources,omitempty"`
	Evidence        []EvidenceItem     `bson:"evidence" json:"evidence"`
	Capabilities    []Capability       `bson:"capabilities" json:"capabilities"`
	Timeline        []TimelineEvent    `bson:"timeline,omitempty" json:"timeline,omitempty"`
	TrustScore      TrustScore         `bson:"trust_score" json:"trust_score"`
	ScoreOverride   bool               `bson:"score_override,omitempty" json:"score_override,omitempty"`
	ActiveSince     time.Time          `bson:"active_since" json:"active_since"`
	LastActivityAt  time.Time          `bson:"last_activity_at" json:"last_activity_at"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

type TimelineEvent struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Label      string           `bson:"label" json:"label"`
	Type       string           `bson:"type" json:"type"`
	Platform   string           `bson:"platform" json:"platform"`
	Verified   bool             `bson:"verified" json:"verified"`
	OccurredAt time.Time        `bson:"occurred_at" json:"occurred_at"`
}

type VerificationRequest struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProfileID    primitive.ObjectID `bson:"profile_id" json:"profile_id"`
	RequesterID  primitive.ObjectID `bson:"requester_id" json:"requester_id"`
	VerifierEmail string            `bson:"verifier_email" json:"verifier_email"`
	SkillArea    string             `bson:"skill_area" json:"skill_area"`
	Context      string             `bson:"context" json:"context"`
	Token        string             `bson:"token" json:"token"`
	Status       string             `bson:"status" json:"status"`
	ExpiresAt    time.Time          `bson:"expires_at" json:"expires_at"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
}

type ActivityAlert struct {
	Type      string    `bson:"type" json:"type"`
	Message   string    `bson:"message" json:"message"`
	Delta     float64   `bson:"delta,omitempty" json:"delta,omitempty"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

type ComparativeInsight struct {
	Dimension  string  `json:"dimension"`
	Percentile float64 `json:"percentile"`
	Message    string  `json:"message"`
}

type PublicProfileView struct {
	Handle         string               `json:"handle"`
	DisplayName    string               `json:"display_name"`
	Headline       string               `json:"headline,omitempty"`
	AvatarURL      string               `json:"avatar_url,omitempty"`
	TrustScore     TrustScore           `json:"trust_score"`
	Capabilities   []Capability         `json:"capabilities"`
	Evidence       []EvidenceItem       `json:"evidence,omitempty"`
	EvidenceCount  int                  `json:"evidence_count"`
	Timeline       []TimelineEvent      `json:"timeline,omitempty"`
	Insights       []ComparativeInsight `json:"insights,omitempty"`
	ActiveSince    time.Time            `json:"active_since"`
	IsShadow       bool                 `json:"is_shadow"`
	IsClaimed      bool                 `json:"is_claimed"`
	ViewMode            string               `json:"view_mode"`
	BadgeMarkdown       string               `json:"badge_markdown,omitempty"`
	EstimatedScoreMin   float64              `json:"estimated_score_min,omitempty"`
	EstimatedScoreMax   float64              `json:"estimated_score_max,omitempty"`
	ProfileCompleteness float64              `json:"profile_completeness,omitempty"`
	IsPro               bool                 `json:"is_pro,omitempty"`
	IsOwner             bool                 `json:"is_owner,omitempty"`
	Stats               []ProfileStatView    `json:"stats,omitempty"`
	SocialLinks         []SocialLink         `json:"social_links,omitempty"`
	GitHubPublicEmail   string               `json:"github_public_email,omitempty"`
	AIInsight           *ProfileInsight      `json:"ai_insight,omitempty"`
	RecruiterReport     *RecruiterReport     `json:"recruiter_report,omitempty"`
	EnrichedSources     []EnrichedSource     `json:"enriched_sources,omitempty"`
}

type ProfileStatView struct {
	Key      string `json:"key"`
	Label    string `json:"label"`
	Value    int    `json:"value"`
	Display  string `json:"display"`
	Platform string `json:"platform"`
	Category string `json:"category"`
	URL      string `json:"url,omitempty"`
	Verified bool   `json:"verified"`
	Detail   string `json:"detail,omitempty"`
}

type ScoreSnapshot struct {
	ProfileID  primitive.ObjectID `bson:"profile_id" json:"profile_id"`
	Overall    float64            `bson:"overall" json:"overall"`
	Dimensions ScoreDimensions    `bson:"dimensions" json:"dimensions"`
	RecordedAt time.Time          `bson:"recorded_at" json:"recorded_at"`
}

type WebhookDelivery struct {
	ProfileID   primitive.ObjectID `bson:"profile_id"`
	URL         string             `bson:"url"`
	Payload     string             `bson:"payload"`
	DeliveredAt time.Time          `bson:"delivered_at"`
}

type TrustScoreResponse struct {
	Handle         string     `json:"handle"`
	Mode           string     `json:"mode"`
	TrustScore     TrustScore `json:"trust_score,omitempty"`
	ScoreBand      string     `json:"score_band,omitempty"`
	AboveThreshold *bool      `json:"above_threshold,omitempty"`
}
