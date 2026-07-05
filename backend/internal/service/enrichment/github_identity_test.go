package enrichment

import (
	"testing"

	"github.com/trustgraph/backend/internal/models"
)

func testProfile(login string) *models.Profile {
	return &models.Profile{
		Handle:      "pragya79645",
		DisplayName: "Pragya",
		DataSources: []models.DataSource{
			{Platform: "github", ExternalID: login, Connected: true},
		},
		SocialLinks: []models.SocialLink{
			{Platform: "github", URL: "https://github.com/" + login},
		},
	}
}

func TestShouldIncludeWebSource_blocksOtherGitHubProfiles(t *testing.T) {
	profile := testProfile("pragya79645")
	if shouldIncludeWebSource(profile, "https://github.com/ankur-bag") {
		t.Fatal("expected other github profile to be excluded")
	}
	if !shouldIncludeWebSource(profile, "https://github.com/pragya79645") {
		t.Fatal("expected canonical github profile to be included")
	}
	if !shouldIncludeWebSource(profile, "https://linkedin.com/in/pragya") {
		t.Fatal("expected non-github source to be included")
	}
}

func TestShouldIncludeWebSource_blocksOtherGitHubRepos(t *testing.T) {
	profile := testProfile("pragya79645")
	if shouldIncludeWebSource(profile, "https://github.com/ankurrera/SoloLeveling") {
		t.Fatal("expected other user's repo to be excluded")
	}
	if !shouldIncludeWebSource(profile, "https://github.com/pragya79645/portfolio") {
		t.Fatal("expected canonical user's repo to be included")
	}
}

func TestSanitizeGitHubMentions(t *testing.T) {
	profile := testProfile("pragya79645")
	text := sanitizeGitHubMentions(
		"He operates two GitHub accounts (ankur-bag and ankurrera). See github.com/pragya79645.",
		"pragya79645",
	)
	if text == "" {
		t.Fatal("expected sanitized text")
	}
	if contains(text, "ankur-bag") || contains(text, "ankurrera") {
		t.Fatalf("unexpected raw github usernames in sanitized text: %q", text)
	}
	if !contains(text, "github.com/pragya79645") {
		t.Fatalf("expected canonical username preserved: %q", text)
	}

	insight := &models.ProfileInsight{
		Summary:    text,
		Highlights: []string{"Maintains github.com/ankurrera with 94 stars"},
		SourceURLs: []string{
			"https://github.com/ankur-bag",
			"https://github.com/pragya79645",
			"https://linkedin.com/in/pragya",
		},
	}
	sanitizeInsightText(profile, insight)
	if len(insight.SourceURLs) != 2 {
		t.Fatalf("expected filtered source urls, got %v", insight.SourceURLs)
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || indexOf(s, sub) >= 0)
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
