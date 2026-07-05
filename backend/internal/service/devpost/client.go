package devpost

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type Client struct {
	httpClient *http.Client
}

type UserStats struct {
	Username    string
	DisplayName string
	ProjectCount int
	WinCount     int
	ProfileURL   string
}

var projectCountRe = regexp.MustCompile(`(\d+)\s+projects?`)
var winCountRe = regexp.MustCompile(`(\d+)\s+wins?`)

func NewClient() *Client {
	return &Client{httpClient: &http.Client{Timeout: 15 * time.Second}}
}

func (c *Client) FetchByUsername(ctx context.Context, username string) (*UserStats, error) {
	username = strings.TrimSpace(strings.ToLower(username))
	if username == "" {
		return nil, fmt.Errorf("username required")
	}

	url := fmt.Sprintf("https://devpost.com/%s", username)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "TrustGraph/1.0")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("devpost user not found")
	}
	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("devpost returned %s", res.Status)
	}

	body, _ := io.ReadAll(res.Body)
	html := string(body)

	stats := &UserStats{
		Username:   username,
		ProfileURL: url,
	}
	if m := projectCountRe.FindStringSubmatch(html); len(m) > 1 {
		fmt.Sscanf(m[1], "%d", &stats.ProjectCount)
	}
	if stats.ProjectCount == 0 {
		stats.ProjectCount = strings.Count(html, "software-listing")
		if stats.ProjectCount == 0 {
			stats.ProjectCount = 1
		}
	}
	if m := winCountRe.FindStringSubmatch(html); len(m) > 1 {
		fmt.Sscanf(m[1], "%d", &stats.WinCount)
	}

	titleRe := regexp.MustCompile(`<title>([^<]+)</title>`)
	if m := titleRe.FindStringSubmatch(html); len(m) > 1 {
		stats.DisplayName = strings.TrimSpace(strings.Split(m[1], "|")[0])
	}

	return stats, nil
}
