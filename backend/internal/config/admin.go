package config

import "strings"

func (c *Config) AdminGitHubUsers() []string {
	raw := strings.TrimSpace(getEnv("ADMIN_GITHUB_USERS", "rishicds"))
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		u := strings.ToLower(strings.TrimSpace(p))
		if u != "" {
			out = append(out, u)
		}
	}
	return out
}

func (c *Config) IsAdminGitHub(username string) bool {
	u := strings.ToLower(strings.TrimSpace(username))
	if u == "" {
		return false
	}
	for _, admin := range c.AdminGitHubUsers() {
		if admin == u {
			return true
		}
	}
	return false
}
