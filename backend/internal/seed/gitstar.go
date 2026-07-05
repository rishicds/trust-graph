package seed

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

const (
	gitstarUsersURL = "https://gitstar-ranking.com/users"
	gitstarMaxPages = 100
	gitstarPageSize = 100
)

var gitstarUserLinkRE = regexp.MustCompile(`class="list-group-item paginated_item" href="/([^"/]+)"`)

var gitstarReservedPaths = map[string]struct{}{
	"users":         {},
	"organizations": {},
	"repositories":  {},
	"rankings":      {},
	"about":         {},
	"privacy":       {},
	"terms":         {},
}

// FetchGitstarUsernames scrapes GitHub usernames from gitstar-ranking.com/users.
// Each page lists 100 users; pages is capped at gitstarMaxPages (100).
func FetchGitstarUsernames(ctx context.Context, pages int) ([]string, error) {
	if pages < 1 {
		pages = 1
	}
	if pages > gitstarMaxPages {
		pages = gitstarMaxPages
	}

	client := &http.Client{Timeout: 30 * time.Second}
	seen := make(map[string]struct{})
	var out []string

	for page := 1; page <= pages; page++ {
		url := gitstarUsersURL
		if page > 1 {
			url = fmt.Sprintf("%s?page=%d", gitstarUsersURL, page)
		}

		usernames, err := fetchGitstarPage(ctx, client, url)
		if err != nil {
			return out, fmt.Errorf("gitstar page %d: %w", page, err)
		}
		if len(usernames) == 0 {
			break
		}

		for _, u := range usernames {
			if _, ok := seen[u]; ok {
				continue
			}
			seen[u] = struct{}{}
			out = append(out, u)
		}

		if page < pages {
			select {
			case <-ctx.Done():
				return out, ctx.Err()
			case <-time.After(1200 * time.Millisecond):
			}
		}
	}

	return out, nil
}

func fetchGitstarPage(ctx context.Context, client *http.Client, url string) ([]string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "TrustGraph-ShadowSeeder/1.0 (+https://github.com/trustgraph)")
	req.Header.Set("Accept", "text/html")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return nil, err
	}

	return parseGitstarUsernames(string(body)), nil
}

func parseGitstarUsernames(html string) []string {
	matches := gitstarUserLinkRE.FindAllStringSubmatch(html, -1)
	if len(matches) == 0 {
		return nil
	}

	var out []string
	seen := make(map[string]struct{})
	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		username := strings.ToLower(strings.TrimSpace(m[1]))
		if username == "" {
			continue
		}
		if _, reserved := gitstarReservedPaths[username]; reserved {
			continue
		}
		if _, dup := seen[username]; dup {
			continue
		}
		seen[username] = struct{}{}
		out = append(out, username)
	}
	return out
}

// FormatUsernameList renders usernames as a line-delimited file with header comments.
func FormatUsernameList(usernames []string, source string, pages int) string {
	var b strings.Builder
	b.WriteString("# GitHub usernames sourced from gitstar-ranking.com/users\n")
	b.WriteString(fmt.Sprintf("# Fetched %d users from %d page(s) — https://gitstar-ranking.com/users\n", len(usernames), pages))
	b.WriteString("# Run: go run ./cmd/seed-shadows\n")
	b.WriteString("# Requires GITHUB_TOKEN in backend/.env\n\n")
	for _, u := range usernames {
		b.WriteString(u)
		b.WriteByte('\n')
	}
	return b.String()
}
