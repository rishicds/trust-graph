package enrichment

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	DefaultGeminiModel = "gemini-2.0-flash"
	GeminiBaseURL      = "https://generativelanguage.googleapis.com/v1beta"
)

type GeminiClient struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

func NewGeminiClient(apiKey, model string) *GeminiClient {
	if model == "" {
		model = DefaultGeminiModel
	}
	return &GeminiClient{
		apiKey: apiKey,
		model:  model,
		httpClient: &http.Client{
			Timeout: 300 * time.Second,
		},
	}
}

func (c *GeminiClient) Enabled() bool {
	return c != nil && c.apiKey != ""
}

func (c *GeminiClient) ModelName() string {
	if c == nil {
		return ""
	}
	return c.model
}

func (c *GeminiClient) GenerateRecruiterInsights(ctx context.Context, systemPrompt, userPrompt string) (*RecruiterDraft, error) {
	raw, err := c.generateJSON(ctx, systemPrompt, userPrompt, 8192)
	if err != nil {
		return nil, err
	}
	var out RecruiterDraft
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("parse gemini recruiter json: %w", err)
	}
	return &out, nil
}

func (c *GeminiClient) GenerateStructuredJSON(ctx context.Context, systemPrompt, userPrompt string, maxTokens int) ([]byte, error) {
	return c.generateJSON(ctx, systemPrompt, userPrompt, maxTokens)
}

func (c *GeminiClient) GenerateInsights(ctx context.Context, systemPrompt, userPrompt string) (*InsightDraft, error) {
	raw, err := c.generateJSON(ctx, systemPrompt, userPrompt, 4096)
	if err != nil {
		return nil, err
	}
	var draft InsightDraft
	if err := json.Unmarshal(raw, &draft); err != nil {
		return nil, fmt.Errorf("parse gemini json: %w (raw: %s)", err, truncate(string(raw), 200))
	}
	return &draft, nil
}

func (c *GeminiClient) generateJSON(ctx context.Context, systemPrompt, userPrompt string, maxTokens int) ([]byte, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("gemini not configured")
	}

	body, err := json.Marshal(map[string]interface{}{
		"system_instruction": map[string]interface{}{
			"parts": []map[string]string{{"text": systemPrompt}},
		},
		"contents": []map[string]interface{}{
			{
				"role":  "user",
				"parts": []map[string]string{{"text": userPrompt}},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":      0.2,
			"maxOutputTokens":  maxTokens,
			"responseMimeType": "application/json",
		},
	})
	if err != nil {
		return nil, err
	}

	endpoint := fmt.Sprintf("%s/models/%s:generateContent?key=%s",
		strings.TrimRight(GeminiBaseURL, "/"),
		c.model,
		c.apiKey,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("gemini %s: %s", res.Status, strings.TrimSpace(string(raw)))
	}

	var parsed struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini returned no candidates")
	}

	content := strings.TrimSpace(parsed.Candidates[0].Content.Parts[0].Text)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	return []byte(content), nil
}
