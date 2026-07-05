package github

import (
	"regexp"
	"strings"
)

var (
	linkedInBioRe = regexp.MustCompile(`(?i)(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)`)
	twitterBioRe  = regexp.MustCompile(`(?i)(?:https?://)?(?:www\.)?(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)`)
	urlInBioRe    = regexp.MustCompile(`(?i)(https?://[^\s]+)`)
)

type SocialLinks struct {
	Website  string
	Twitter  string
	LinkedIn string
	GitHub   string
}

func BuildSocialLinks(login, bio, blog, twitterUsername, htmlURL string, graphAccounts []graphSocialAccount) SocialLinks {
	links := SocialLinks{
		GitHub: firstNonEmpty(htmlURL, "https://github.com/"+login),
	}
	links.Website = normalizeURL(blog)
	links.Twitter = twitterURL(twitterUsername)

	for _, acct := range graphAccounts {
		provider := strings.ToUpper(strings.TrimSpace(acct.Provider))
		url := normalizeURL(acct.URL)
		if url == "" {
			continue
		}
		switch provider {
		case "LINKEDIN":
			links.LinkedIn = url
		case "TWITTER":
			links.Twitter = url
		case "GENERIC", "WEBSITE":
			if links.Website == "" || isGitHubURL(links.Website) {
				links.Website = url
			}
		}
	}

	if links.LinkedIn == "" {
		links.LinkedIn = extractLinkedInFromBio(bio)
	}
	if links.Twitter == "" {
		links.Twitter = extractTwitterFromBio(bio)
	}
	if links.Website == "" {
		links.Website = extractWebsiteFromBio(bio, login)
	}

	// Don't duplicate GitHub as website
	if links.Website != "" && isGitHubURL(links.Website) {
		links.Website = ""
	}

	return links
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func normalizeURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	return "https://" + raw
}

func twitterURL(username string) string {
	username = strings.TrimPrefix(strings.TrimSpace(username), "@")
	if username == "" {
		return ""
	}
	return "https://x.com/" + username
}

func extractLinkedInFromBio(bio string) string {
	match := linkedInBioRe.FindStringSubmatch(bio)
	if len(match) < 2 {
		return ""
	}
	return "https://linkedin.com/in/" + match[1]
}

func extractTwitterFromBio(bio string) string {
	match := twitterBioRe.FindStringSubmatch(bio)
	if len(match) < 2 {
		return ""
	}
	return "https://x.com/" + match[1]
}

func extractWebsiteFromBio(bio string, login string) string {
	for _, match := range urlInBioRe.FindAllString(bio, -1) {
		url := strings.TrimRight(match, ".,)")
		lower := strings.ToLower(url)
		if strings.Contains(lower, "github.com") ||
			strings.Contains(lower, "linkedin.com") ||
			strings.Contains(lower, "twitter.com") ||
			strings.Contains(lower, "x.com") {
			continue
		}
		return normalizeURL(url)
	}
	return ""
}

func isGitHubURL(url string) bool {
	return strings.Contains(strings.ToLower(url), "github.com")
}

type graphSocialAccount struct {
	Provider string
	URL      string
}
