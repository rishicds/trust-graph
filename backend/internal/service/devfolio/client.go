package devfolio

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/trustgraph/backend/internal/service/enrichment"
)

type DevfolioStats struct {
	Username      string      `json:"username"`
	DisplayName   string      `json:"display_name"`
	ProfileURL    string      `json:"profile_url"`
	Hackathons    []Hackathon `json:"hackathons"`
	Projects      []Project   `json:"projects"`
	TotalWins     int         `json:"total_wins"`
	TotalTrophies int         `json:"total_trophies"`
}

type Hackathon struct {
	Name   string `json:"name"`
	Role   string `json:"role"`
	Result string `json:"result"`
	Year   int    `json:"year"`
	URL    string `json:"url"`
}

type Project struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	URL         string   `json:"url"`
	TechStack   []string `json:"tech_stack"`
}

type Client struct {
	enrichmentAgent *enrichment.Agent
}

func NewClient(enrichmentAgent *enrichment.Agent) *Client {
	return &Client{enrichmentAgent: enrichmentAgent}
}

func NormalizeProfileURL(input string) (string, error) {
	input = strings.TrimSpace(input)
	if input == "" {
		return "", fmt.Errorf("devfolio profile url required")
	}
	input = strings.TrimPrefix(input, "@")
	lower := strings.ToLower(input)
	if !strings.Contains(lower, "devfolio.co") {
		username := strings.Trim(strings.TrimPrefix(input, "@"), "/")
		if username == "" {
			return "", fmt.Errorf("devfolio profile url required")
		}
		return "https://devfolio.co/@" + username, nil
	}
	if !strings.HasPrefix(lower, "http") {
		input = "https://" + input
	}
	return strings.TrimSuffix(input, "/"), nil
}

func UsernameFromProfileURL(profileURL string) string {
	profileURL = strings.TrimSuffix(strings.TrimSpace(profileURL), "/")
	if idx := strings.LastIndex(profileURL, "/"); idx >= 0 {
		return strings.TrimPrefix(profileURL[idx+1:], "@")
	}
	return ""
}

func (c *Client) FetchProfile(ctx context.Context, profileURL string) (*DevfolioStats, error) {
	if c.enrichmentAgent == nil {
		return nil, fmt.Errorf("devfolio enrichment not configured")
	}
	firecrawl := c.enrichmentAgent.Firecrawl()
	if firecrawl == nil || !firecrawl.Enabled() {
		return nil, fmt.Errorf("FIRECRAWL_API_KEY required to scrape Devfolio profiles")
	}
	caps := c.enrichmentAgent.Capabilities()
	if !caps["gemini"] && !caps["nvidia_ai"] {
		return nil, fmt.Errorf("GEMINI_API_KEY or NVIDIA_AI_API required to parse Devfolio profiles")
	}

	profileURL, err := NormalizeProfileURL(profileURL)
	if err != nil {
		return nil, err
	}

	scrapeRes, err := c.enrichmentAgent.Firecrawl().Scrape(ctx, profileURL)
	if err != nil {
		return nil, fmt.Errorf("devfolio scrape failed: %w", err)
	}

	systemPrompt := `You are TrustGraph's professional profile analyst. Extract structured data from the provided Devfolio profile markdown.
Focus on:
1. User's display name and username.
2. List of hackathons participated in, including the result (e.g., Winner, 1st Runner Up, Top 10, Participant), the role they played, and the year.
3. List of projects built, with a brief description and the tech stack used.
4. Total number of wins and trophies mentioned.

Return the result as a strict JSON object matching this structure:
{
  "username": "string",
  "display_name": "string",
  "profile_url": "string",
  "hackathons": [{ "name": "string", "role": "string", "result": "string", "year": number, "url": "string" }],
  "projects": [{ "name": "string", "description": "string", "url": "string", "tech_stack": ["string"] }],
  "total_wins": number,
  "total_trophies": number
}
If a field is missing, use null or empty list.`

	userPrompt := fmt.Sprintf("Devfolio Profile Markdown:\n\n%s", scrapeRes.Markdown)

	raw, err := c.enrichmentAgent.GenerateJSON(ctx, systemPrompt, userPrompt, 4096)
	if err != nil {
		return nil, fmt.Errorf("failed to generate devfolio json: %w", err)
	}

	var stats DevfolioStats
	if err := json.Unmarshal(raw, &stats); err != nil {
		return nil, fmt.Errorf("failed to parse devfolio json: %w (raw: %s)", err, string(raw))
	}

	stats.ProfileURL = profileURL
	if stats.Username == "" {
		stats.Username = UsernameFromProfileURL(profileURL)
	}
	return &stats, nil
}
