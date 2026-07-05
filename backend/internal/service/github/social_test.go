package github

import "testing"

func TestBuildSocialLinksFromREST(t *testing.T) {
	links := BuildSocialLinks(
		"octocat",
		"Building things. https://linkedin.com/in/octocat-dev",
		"https://octocat.dev",
		"octocat",
		"https://github.com/octocat",
		nil,
	)

	if links.GitHub != "https://github.com/octocat" {
		t.Fatalf("github: got %q", links.GitHub)
	}
	if links.Website != "https://octocat.dev" {
		t.Fatalf("website: got %q", links.Website)
	}
	if links.Twitter != "https://x.com/octocat" {
		t.Fatalf("twitter: got %q", links.Twitter)
	}
	if links.LinkedIn != "https://linkedin.com/in/octocat-dev" {
		t.Fatalf("linkedin: got %q", links.LinkedIn)
	}
}

func TestBuildSocialLinksGraphQLOverride(t *testing.T) {
	links := BuildSocialLinks("dev", "", "", "", "https://github.com/dev", []graphSocialAccount{
		{Provider: "LINKEDIN", URL: "https://linkedin.com/in/dev-pro"},
		{Provider: "TWITTER", URL: "https://x.com/devhandle"},
	})
	if links.LinkedIn != "https://linkedin.com/in/dev-pro" {
		t.Fatalf("linkedin: got %q", links.LinkedIn)
	}
	if links.Twitter != "https://x.com/devhandle" {
		t.Fatalf("twitter: got %q", links.Twitter)
	}
}
