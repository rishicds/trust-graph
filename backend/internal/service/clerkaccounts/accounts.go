package clerkaccounts

import (
	"encoding/json"
	"regexp"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
)

var linkedInSlugPathRe = regexp.MustCompile(`(?i)linkedin\.com/in/([a-zA-Z0-9_-]+)`)

type LinkedAccounts struct {
	GitHubUsername   string
	LinkedInUsername string
	LinkedInName     string
	LinkedInLinked   bool
}

func Parse(user *clerk.User) LinkedAccounts {
	out := LinkedAccounts{}
	if user == nil {
		return out
	}
	for _, acct := range user.ExternalAccounts {
		provider := strings.ToLower(acct.Provider)
		username := ""
		if acct.Username != nil {
			username = strings.TrimSpace(*acct.Username)
		}
		switch {
		case strings.Contains(provider, "github"):
			if username != "" {
				out.GitHubUsername = username
			}
		case strings.Contains(provider, "linkedin"):
			out.LinkedInLinked = true
			slug := linkedInSlugFromAccount(acct)
			if slug != "" {
				out.LinkedInUsername = slug
			}
			name := strings.TrimSpace(strings.TrimSpace(acct.FirstName) + " " + strings.TrimSpace(acct.LastName))
			if name != "" {
				out.LinkedInName = name
			}
		}
	}
	return out
}

func linkedInSlugFromAccount(acct *clerk.ExternalAccount) string {
	if acct == nil {
		return ""
	}
	if acct.Username != nil {
		if slug := NormalizeLinkedInSlug(*acct.Username); slug != "" {
			return slug
		}
	}
	if acct.Label != nil {
		if slug := NormalizeLinkedInSlug(*acct.Label); slug != "" {
			return slug
		}
	}
	if slug := linkedInSlugFromMetadata(acct.PublicMetadata); slug != "" {
		return slug
	}
	return ""
}

func linkedInSlugFromMetadata(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}
	var meta map[string]any
	if err := json.Unmarshal(raw, &meta); err != nil {
		return ""
	}
	for _, key := range []string{
		"vanity_name",
		"vanityName",
		"slug",
		"preferred_username",
		"username",
		"public_profile_url",
		"profile_url",
	} {
		rawVal, ok := meta[key]
		if !ok {
			continue
		}
		str, ok := rawVal.(string)
		if !ok {
			continue
		}
		if slug := NormalizeLinkedInSlug(str); slug != "" {
			return slug
		}
	}
	return ""
}

// NormalizeLinkedInSlug accepts a vanity slug or linkedin.com/in/ URL.
func NormalizeLinkedInSlug(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if match := linkedInSlugPathRe.FindStringSubmatch(raw); len(match) > 1 {
		return strings.ToLower(match[1])
	}
	raw = strings.TrimPrefix(raw, "@")
	raw = strings.Trim(raw, "/")
	if raw == "" || strings.Contains(raw, "/") || strings.Contains(raw, " ") {
		return ""
	}
	return strings.ToLower(raw)
}
