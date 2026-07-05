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

type TavilyClient struct {
	apiKey     string
	httpClient *http.Client
}

func NewTavilyClient(apiKey string) *TavilyClient {
	return &TavilyClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *TavilyClient) Enabled() bool {
	return c != nil && c.apiKey != ""
}

type SearchHit struct {
	Title   string
	URL     string
	Content string
}

func (c *TavilyClient) Search(ctx context.Context, query string, maxResults int) ([]SearchHit, error) {
	return c.search(ctx, query, maxResults, "basic")
}

func (c *TavilyClient) SearchAdvanced(ctx context.Context, query string, maxResults int) ([]SearchHit, error) {
	return c.search(ctx, query, maxResults, "advanced")
}

func (c *TavilyClient) search(ctx context.Context, query string, maxResults int, depth string) ([]SearchHit, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("tavily not configured")
	}
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, fmt.Errorf("query required")
	}
	if maxResults <= 0 {
		maxResults = 5
	}

	body, err := json.Marshal(map[string]interface{}{
		"api_key":             c.apiKey,
		"query":               query,
		"max_results":         maxResults,
		"search_depth":        depth,
		"include_answer":      false,
		"include_raw_content": false,
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.tavily.com/search", bytes.NewReader(body))
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
		return nil, fmt.Errorf("tavily %s: %s", res.Status, strings.TrimSpace(string(raw)))
	}

	var parsed struct {
		Results []struct {
			Title   string `json:"title"`
			URL     string `json:"url"`
			Content string `json:"content"`
		} `json:"results"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, err
	}

	out := make([]SearchHit, 0, len(parsed.Results))
	for _, r := range parsed.Results {
		out = append(out, SearchHit{
			Title:   r.Title,
			URL:     r.URL,
			Content: truncate(r.Content, 2000),
		})
	}
	return out, nil
}
