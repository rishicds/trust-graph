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

type FirecrawlClient struct {
	apiKey     string
	httpClient *http.Client
}

func NewFirecrawlClient(apiKey string) *FirecrawlClient {
	return &FirecrawlClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 90 * time.Second,
		},
	}
}

func (c *FirecrawlClient) Enabled() bool {
	return c != nil && c.apiKey != ""
}

type ScrapeResult struct {
	URL      string
	Markdown string
	Title    string
}

func (c *FirecrawlClient) Scrape(ctx context.Context, pageURL string) (*ScrapeResult, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("firecrawl not configured")
	}
	pageURL = strings.TrimSpace(pageURL)
	if pageURL == "" {
		return nil, fmt.Errorf("url required")
	}

	body, err := json.Marshal(map[string]interface{}{
		"url":     pageURL,
		"formats": []string{"markdown"},
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.firecrawl.dev/v1/scrape", bytes.NewReader(body))
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
		return nil, fmt.Errorf("firecrawl %s: %s", res.Status, strings.TrimSpace(string(raw)))
	}

	var parsed struct {
		Success bool `json:"success"`
		Data    struct {
			Markdown string `json:"markdown"`
			Metadata struct {
				Title       string `json:"title"`
				SourceURL   string `json:"sourceURL"`
				Description string `json:"description"`
			} `json:"metadata"`
		} `json:"data"`
		Error string `json:"error"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}
	if !parsed.Success {
		if parsed.Error != "" {
			return nil, fmt.Errorf("firecrawl: %s", parsed.Error)
		}
		return nil, fmt.Errorf("firecrawl scrape failed")
	}

	title := parsed.Data.Metadata.Title
	if title == "" {
		title = parsed.Data.Metadata.Description
	}

	return &ScrapeResult{
		URL:      pageURL,
		Markdown: truncate(parsed.Data.Markdown, 12000),
		Title:    title,
	}, nil
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "\n\n[truncated]"
}
