package config

import (
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	MongoURI           string
	MongoDatabase      string
	JWTSecret          string
	ClerkSecret        string
	CORSOrigin         string
	GitHubToken        string
	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURI  string
	FrontendURL        string
	StripeSecretKey    string
	StripeWebhookSecret string
	StripeProPriceID   string
	ResendAPIKey       string
	EmailFrom          string
	SMTPHost           string
	SMTPPort           string
	SMTPUser           string
	SMTPPassword       string
	SMTPFrom           string
	JobRefreshEnabled  bool
	NVIDIAAPIKey       string
	NVIDIAModel        string
	GeminiAPIKey       string
	GeminiModel        string
	TavilyAPIKey       string
	FirecrawlAPIKey    string
	PineconeAPIKey     string
	PineconeIndexHost  string
}

func Load() (*Config, error) {
	loadEnvFiles()

	mongoURI := strings.TrimSpace(os.Getenv("MONGODB_URI"))
	if mongoURI == "" {
		return nil, errors.New("MONGODB_URI is required — set it in backend/.env (cloud MongoDB Atlas URI)")
	}
	if strings.HasPrefix(mongoURI, "mongodb://localhost") || strings.HasPrefix(mongoURI, "mongodb://127.0.0.1") {
		return nil, errors.New("local MongoDB is disabled — set MONGODB_URI to your cloud Atlas connection string in backend/.env")
	}

	return &Config{
		Port:                getEnv("PORT", "8080"),
		MongoURI:            mongoURI,
		MongoDatabase:       getEnv("MONGODB_DATABASE", "trustgraph"),
		JWTSecret:           getEnv("JWT_SECRET", "dev-secret-change-me"),
		ClerkSecret:         getEnv("CLERK_SECRET_KEY", ""),
		CORSOrigin:          getEnv("CORS_ORIGIN", "http://localhost:3000"),
		GitHubToken:         getEnv("GITHUB_TOKEN", ""),
		GitHubClientID:      getEnv("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret:  getEnv("GITHUB_CLIENT_SECRET", ""),
		GitHubRedirectURI:   getEnv("GITHUB_REDIRECT_URI", "http://localhost:8080/v1/integrations/github/callback"),
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:3000"),
		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
		StripeProPriceID:    getEnv("STRIPE_PRO_PRICE_ID", ""),
		ResendAPIKey:        getEnv("RESEND_API_KEY", ""),
		EmailFrom:           getEnv("EMAIL_FROM", "TrustGraph <onboarding@trustgraph.dev>"),
		SMTPHost:            getEnv("SMTP_HOST", ""),
		SMTPPort:            getEnv("SMTP_PORT", "587"),
		SMTPUser:            getEnv("SMTP_USER", ""),
		SMTPPassword:        getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:            getEnv("SMTP_FROM", ""),
		JobRefreshEnabled:   getEnv("JOB_REFRESH_ENABLED", "true") == "true",
		NVIDIAAPIKey:        getEnv("NVIDIA_AI_API", ""),
		NVIDIAModel:         getEnv("NVIDIA_AI_MODEL", "z-ai/glm-5.1"),
		GeminiAPIKey:        getEnv("GEMINI_API_KEY", ""),
		GeminiModel:         getEnv("GEMINI_MODEL", "gemini-2.0-flash"),
		TavilyAPIKey:        getEnv("TAVILY_API_KEY", ""),
		FirecrawlAPIKey:     getEnv("FIRECRAWL_API_KEY", ""),
		PineconeAPIKey:      getEnv("PINECONE_API_KEY", ""),
		PineconeIndexHost:   getEnv("PINECONE_INDEX_HOST", ""),
	}, nil
}

func loadEnvFiles() {
	for _, path := range []string{".env", "backend/.env"} {
		_ = godotenv.Load(path)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (c *Config) MongoLogLabel() string {
	if strings.Contains(c.MongoURI, "mongodb+srv://") {
		return fmt.Sprintf("MongoDB Atlas (%s)", c.MongoDatabase)
	}
	return fmt.Sprintf("MongoDB (%s)", c.MongoDatabase)
}

func (c *Config) GitHubOAuthEnabled() bool {
	return c.GitHubClientID != "" && c.GitHubClientSecret != ""
}

func (c *Config) StripeEnabled() bool {
	return c.StripeSecretKey != "" && c.StripeProPriceID != ""
}

func (c *Config) EmailEnabled() bool {
	return c.ResendAPIKey != "" || c.SMTPEnabled()
}

func (c *Config) SMTPEnabled() bool {
	return strings.TrimSpace(c.SMTPHost) != "" && strings.TrimSpace(c.SMTPUser) != ""
}

func (c *Config) EnrichmentEnabled() bool {
	return c.NVIDIAAPIKey != "" || c.GeminiAPIKey != ""
}

func (c *Config) FirecrawlEnabled() bool {
	return c.FirecrawlAPIKey != ""
}

func (c *Config) TavilyEnabled() bool {
	return c.TavilyAPIKey != ""
}

func (c *Config) PineconeEnabled() bool {
	return c.PineconeAPIKey != "" && c.PineconeIndexHost != ""
}
