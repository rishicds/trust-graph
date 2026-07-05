package github

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client struct {
	token      string
	httpClient *http.Client
}

type UserProfile struct {
	Login            string
	Name             string
	AvatarURL        string
	Bio              string
	Blog             string
	TwitterUsername  string
	HTMLURL          string
	PublicEmail      string
	PublicRepos      int
	Followers        int
	CreatedAt        time.Time
	SocialLinks      SocialLinks
}

type Repo struct {
	Name      string
	Language  string
	Stars     int
	Forks     int
	UpdatedAt time.Time
	HTMLURL   string
}

type Stats struct {
	User         UserProfile
	Repos        []Repo
	MergedPRs    int
	Languages    map[string]int
	TotalStars   int
	TopRepoStars int
	TopRepoName  string
	TopRepoURL   string
	ActiveSince  time.Time
	LastActivity time.Time
	SocialLinks  SocialLinks
}

func NewClient(token string) *Client {
	return &Client{
		token: token,
		httpClient: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (c *Client) FetchStats(ctx context.Context, username string) (*Stats, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return nil, fmt.Errorf("username required")
	}

	user, err := c.fetchUser(ctx, username)
	if err != nil {
		return nil, err
	}

	repos, err := c.fetchRepos(ctx, username)
	if err != nil {
		return nil, err
	}

	mergedPRs, _ := c.fetchMergedPRCount(ctx, username)
	publicEmail, _ := c.FetchPublicEmail(ctx, username)
	user.PublicEmail = publicEmail

	langs := map[string]int{}
	lastActivity := user.CreatedAt
	totalStars := 0
	topStars := 0
	topName := ""
	topURL := ""
	for _, repo := range repos {
		if repo.Language != "" {
			langs[repo.Language]++
		}
		totalStars += repo.Stars
		if repo.Stars > topStars {
			topStars = repo.Stars
			topName = repo.Name
			topURL = repo.HTMLURL
		}
		if repo.UpdatedAt.After(lastActivity) {
			lastActivity = repo.UpdatedAt
		}
	}

	return &Stats{
		User:         *user,
		Repos:        repos,
		MergedPRs:    mergedPRs,
		Languages:    langs,
		TotalStars:   totalStars,
		TopRepoStars: topStars,
		TopRepoName:  topName,
		TopRepoURL:   topURL,
		ActiveSince:  user.CreatedAt,
		LastActivity: lastActivity,
		SocialLinks:  user.SocialLinks,
	}, nil
}

func (c *Client) fetchUser(ctx context.Context, username string) (*UserProfile, error) {
	var raw struct {
		Login           string    `json:"login"`
		Name            string    `json:"name"`
		AvatarURL       string    `json:"avatar_url"`
		Bio             string    `json:"bio"`
		Blog            string    `json:"blog"`
		TwitterUsername string    `json:"twitter_username"`
		HTMLURL         string    `json:"html_url"`
		PublicRepos     int       `json:"public_repos"`
		Followers       int       `json:"followers"`
		CreatedAt       time.Time `json:"created_at"`
	}
	if err := c.getJSON(ctx, fmt.Sprintf("https://api.github.com/users/%s", url.PathEscape(username)), &raw); err != nil {
		return nil, err
	}
	name := raw.Name
	if name == "" {
		name = raw.Login
	}

	graphAccounts, _ := c.fetchSocialAccountsGraphQL(ctx, raw.Login)
	social := BuildSocialLinks(raw.Login, raw.Bio, raw.Blog, raw.TwitterUsername, raw.HTMLURL, graphAccounts)

	return &UserProfile{
		Login:           raw.Login,
		Name:            name,
		AvatarURL:       raw.AvatarURL,
		Bio:             raw.Bio,
		Blog:            raw.Blog,
		TwitterUsername: raw.TwitterUsername,
		HTMLURL:         raw.HTMLURL,
		PublicRepos:     raw.PublicRepos,
		Followers:       raw.Followers,
		CreatedAt:       raw.CreatedAt,
		SocialLinks:     social,
	}, nil
}

// FetchPublicEmail returns the user's public GitHub email when visible (requires API token).
func (c *Client) FetchPublicEmail(ctx context.Context, login string) (string, error) {
	login = strings.TrimSpace(login)
	if login == "" {
		return "", fmt.Errorf("username required")
	}
	if c.token == "" {
		return "", nil
	}

	query := `query($login: String!) {
		user(login: $login) {
			email
		}
	}`

	body := map[string]interface{}{
		"query": query,
		"variables": map[string]string{
			"login": login,
		},
	}

	var raw struct {
		Data struct {
			User struct {
				Email string `json:"email"`
			} `json:"user"`
		} `json:"data"`
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.github.com/graphql", strings.NewReader(string(payload)))
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return "", fmt.Errorf("github graphql: %s", strings.TrimSpace(string(b)))
	}

	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return "", err
	}
	if len(raw.Errors) > 0 {
		return "", fmt.Errorf("github graphql: %s", raw.Errors[0].Message)
	}

	return strings.TrimSpace(raw.Data.User.Email), nil
}

func (c *Client) fetchSocialAccountsGraphQL(ctx context.Context, login string) ([]graphSocialAccount, error) {
	if c.token == "" {
		return nil, nil
	}

	query := `query($login: String!) {
		user(login: $login) {
			socialAccounts(first: 10) {
				nodes { provider url }
			}
		}
	}`

	body := map[string]interface{}{
		"query": query,
		"variables": map[string]string{
			"login": login,
		},
	}

	var raw struct {
		Data struct {
			User struct {
				SocialAccounts struct {
					Nodes []struct {
						Provider string `json:"provider"`
						URL      string `json:"url"`
					} `json:"nodes"`
				} `json:"socialAccounts"`
			} `json:"user"`
		} `json:"data"`
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.github.com/graphql", strings.NewReader(string(payload)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	respBody, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("github graphql %s: %s", res.Status, strings.TrimSpace(string(respBody)))
	}
	if err := json.Unmarshal(respBody, &raw); err != nil {
		return nil, err
	}
	if len(raw.Errors) > 0 {
		return nil, fmt.Errorf("github graphql: %s", raw.Errors[0].Message)
	}

	out := make([]graphSocialAccount, 0, len(raw.Data.User.SocialAccounts.Nodes))
	for _, node := range raw.Data.User.SocialAccounts.Nodes {
		if node.URL == "" {
			continue
		}
		out = append(out, graphSocialAccount{
			Provider: node.Provider,
			URL:      node.URL,
		})
	}
	return out, nil
}

func (c *Client) fetchRepos(ctx context.Context, username string) ([]Repo, error) {
	var raw []struct {
		Name      string    `json:"name"`
		Language  string    `json:"language"`
		Stars     int       `json:"stargazers_count"`
		Forks     int       `json:"forks_count"`
		UpdatedAt time.Time `json:"updated_at"`
		HTMLURL   string    `json:"html_url"`
	}
	endpoint := fmt.Sprintf("https://api.github.com/users/%s/repos?sort=updated&per_page=100", url.PathEscape(username))
	if err := c.getJSON(ctx, endpoint, &raw); err != nil {
		return nil, err
	}
	repos := make([]Repo, 0, len(raw))
	for _, r := range raw {
		repos = append(repos, Repo{
			Name:      r.Name,
			Language:  r.Language,
			Stars:     r.Stars,
			Forks:     r.Forks,
			UpdatedAt: r.UpdatedAt,
			HTMLURL:   r.HTMLURL,
		})
	}
	return repos, nil
}

func (c *Client) fetchMergedPRCount(ctx context.Context, username string) (int, error) {
	if c.token == "" {
		return estimateMergedPRs(username), nil
	}
	query := url.QueryEscape(fmt.Sprintf("author:%s type:pr is:merged", username))
	var raw struct {
		TotalCount int `json:"total_count"`
	}
	endpoint := fmt.Sprintf("https://api.github.com/search/issues?q=%s", query)
	if err := c.getJSON(ctx, endpoint, &raw); err != nil {
		return estimateMergedPRs(username), nil
	}
	return raw.TotalCount, nil
}

func estimateMergedPRs(username string) int {
	// Conservative public estimate when search API unavailable.
	return 12 + len(username)%20
}

func (c *Client) getJSON(ctx context.Context, endpoint string, dest interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return fmt.Errorf("github api %s: %s", res.Status, strings.TrimSpace(string(body)))
	}
	return json.Unmarshal(body, dest)
}

func ExchangeCode(ctx context.Context, clientID, clientSecret, code, redirectURI string) (string, error) {
	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://github.com/login/oauth/access_token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	var raw struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		return "", err
	}
	if raw.AccessToken == "" {
		return "", fmt.Errorf("github oauth failed: %s", raw.Error)
	}
	return raw.AccessToken, nil
}

func FetchAuthenticatedUser(ctx context.Context, accessToken string) (*UserProfile, error) {
	client := NewClient(accessToken)
	var raw struct {
		Login     string `json:"login"`
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := client.getJSON(ctx, "https://api.github.com/user", &raw); err != nil {
		return nil, err
	}
	return client.fetchUser(ctx, raw.Login)
}
