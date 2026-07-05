package avatars

import (
	"strings"
	"testing"
)

func TestResolveUsesProvidedURL(t *testing.T) {
	got := Resolve("alice", "https://avatars.githubusercontent.com/u/1")
	if got != "https://avatars.githubusercontent.com/u/1" {
		t.Fatalf("expected github avatar, got %q", got)
	}
}

func TestResolvePlaceholder(t *testing.T) {
	got := Resolve("pragya79645", "")
	if !strings.Contains(got, "dicebear.com") || !strings.Contains(got, "pragya79645") {
		t.Fatalf("unexpected placeholder url: %q", got)
	}
}
