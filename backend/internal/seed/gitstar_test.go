package seed

import (
	"os"
	"testing"
)

func TestParseGitstarUsernames(t *testing.T) {
	html, err := os.ReadFile("testdata/gitstar_users_page1.html")
	if err != nil {
		t.Skip("tmp_gitstar.html not present")
	}

	usernames := parseGitstarUsernames(string(html))
	if len(usernames) != 100 {
		t.Fatalf("expected 100 usernames, got %d", len(usernames))
	}
	if usernames[0] != "sindresorhus" {
		t.Fatalf("expected sindresorhus first, got %q", usernames[0])
	}
	if usernames[99] != "diygod" {
		t.Fatalf("expected diygod last, got %q", usernames[99])
	}
}
