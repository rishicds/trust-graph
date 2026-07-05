package clerkaccounts

import "testing"

func TestNormalizeLinkedInSlug(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"Jane-Doe", "jane-doe"},
		{"https://www.linkedin.com/in/jane-doe/", "jane-doe"},
		{"linkedin.com/in/jane-doe", "jane-doe"},
		{"@jane-doe", "jane-doe"},
		{"", ""},
		{"https://linkedin.com/company/acme", ""},
	}
	for _, tc := range tests {
		if got := NormalizeLinkedInSlug(tc.in); got != tc.want {
			t.Fatalf("NormalizeLinkedInSlug(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}
