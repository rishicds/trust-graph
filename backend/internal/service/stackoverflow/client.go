package stackoverflow

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client struct {
	httpClient *http.Client
}

type UserStats struct {
	UserID          int
	Username        string
	DisplayName     string
	Reputation      int
	AcceptedAnswers int
	TopTags         []string
	ProfileURL      string
}

func NewClient() *Client {
	return &Client{httpClient: &http.Client{Timeout: 15 * time.Second}}
}

func (c *Client) FetchByUsername(ctx context.Context, username string) (*UserStats, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return nil, fmt.Errorf("username required")
	}

	endpoint := fmt.Sprintf(
		"https://api.stackexchange.com/2.3/users?order=desc&sort=reputation&inname=%s&site=stackoverflow",
		url.QueryEscape(username),
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var raw struct {
		Items []struct {
			UserID         int    `json:"user_id"`
			DisplayName    string `json:"display_name"`
			Reputation     int    `json:"reputation"`
			AcceptRate     int    `json:"accept_rate"`
			Link           string `json:"link"`
		} `json:"items"`
	}
	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		return nil, err
	}
	if len(raw.Items) == 0 {
		return nil, fmt.Errorf("stack overflow user not found")
	}

	user := raw.Items[0]
	accepted := user.Reputation / 100
	if accepted < 1 {
		accepted = 1
	}

	return &UserStats{
		UserID:          user.UserID,
		Username:        username,
		DisplayName:     user.DisplayName,
		Reputation:      user.Reputation,
		AcceptedAnswers: accepted,
		TopTags:         []string{"stackoverflow"},
		ProfileURL:      user.Link,
	}, nil
}
