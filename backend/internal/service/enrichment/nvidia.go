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
	DefaultNVIDIAModel = "z-ai/glm-5.1"
	NVIDIABaseURL      = "https://integrate.api.nvidia.com/v1"
)

type NVIDIAClient struct {
	apiKey     string
	model      string
	baseURL    string
	httpClient *http.Client
}

func normalizeNVIDIAModel(model string) string {
	if model == "" {
		return DefaultNVIDIAModel
	}
	// build.nvidia.com catalog: https://build.nvidia.com/z-ai/glm-5.1
	switch strings.ToLower(strings.TrimSpace(model)) {
	case "z-ai/glm5.1", "glm-5.1", "glm5.1":
		return DefaultNVIDIAModel
	default:
		return model
	}
}

func NewNVIDIAClient(apiKey, model string) *NVIDIAClient {
	return &NVIDIAClient{
		apiKey:  apiKey,
		model:   normalizeNVIDIAModel(model),
		baseURL: NVIDIABaseURL,
		httpClient: &http.Client{
			Timeout: 300 * time.Second,
		},
	}
}

func (c *NVIDIAClient) Enabled() bool {
	return c != nil && c.apiKey != ""
}

func (c *NVIDIAClient) ModelName() string {
	if c == nil {
		return ""
	}
	return c.model
}

type InsightDraft struct {
	Summary                  string   `json:"summary"`
	Highlights               []string `json:"highlights"`
	RoleSignals              []string `json:"role_signals"`
	CrossPlatformConsistency string   `json:"cross_platform_consistency"`
	Gaps                     []string `json:"gaps"`
}

type RecruiterDraft struct {
	InsightDraft
	HiringSignals []string `json:"hiring_signals"`
	RedFlags      []string `json:"red_flags"`
}

func (c *NVIDIAClient) GenerateRecruiterInsights(ctx context.Context, systemPrompt, userPrompt string) (*RecruiterDraft, error) {
	draft, err := c.generateJSON(ctx, systemPrompt, userPrompt, 8192)
	if err != nil {
		return nil, err
	}
	var out RecruiterDraft
	if err := json.Unmarshal(draft, &out); err != nil {
		return nil, fmt.Errorf("parse nvidia recruiter json: %w", err)
	}
	return &out, nil
}

func (c *NVIDIAClient) GenerateInsights(ctx context.Context, systemPrompt, userPrompt string) (*InsightDraft, error) {
	raw, err := c.generateJSON(ctx, systemPrompt, userPrompt, 4096)
	if err != nil {
		return nil, err
	}
	var draft InsightDraft
	if err := json.Unmarshal(raw, &draft); err != nil {
		return nil, fmt.Errorf("parse nvidia json: %w (raw: %s)", err, truncate(string(raw), 200))
	}
	return &draft, nil
}

func (c *NVIDIAClient) GenerateStructuredJSON(ctx context.Context, systemPrompt, userPrompt string, maxTokens int) ([]byte, error) {
	return c.generateJSON(ctx, systemPrompt, userPrompt, maxTokens)
}

func (c *NVIDIAClient) generateJSON(ctx context.Context, systemPrompt, userPrompt string, maxTokens int) ([]byte, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("nvidia ai not configured")
	}

	body, err := json.Marshal(map[string]interface{}{
		"model": c.model,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		// Lower temperature for structured JSON; build.nvidia.com defaults use 1 for open chat.
		"temperature": 0.2,
		"top_p":       1,
		"max_tokens":  maxTokens,
		"stream":      false,
	})
	if err != nil {
		return nil, err
	}

	endpoint := strings.TrimRight(c.baseURL, "/") + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("nvidia %s: %s", res.Status, strings.TrimSpace(string(raw)))
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Choices) == 0 {
		return nil, fmt.Errorf("nvidia returned no choices")
	}

	content := strings.TrimSpace(parsed.Choices[0].Message.Content)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	return []byte(content), nil
}
