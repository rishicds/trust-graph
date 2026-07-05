package recruiter

import "testing"

func TestParseRecruiterQueryEmployer(t *testing.T) {
	parsed := ParseRecruiterQuery("people who worked at devrelsquad")
	if !parsed.RequireEmployer {
		t.Fatal("expected require employer")
	}
	if len(parsed.Employers) == 0 {
		t.Fatal("expected employer extracted")
	}
}

func TestParseRecruiterQueryStructured(t *testing.T) {
	parsed := ParseRecruiterQuery(
		"I need a developer proficient in TypeScript and Rust, worked on Kubernetes tools, lives in Berlin, worked at DevRelSquad",
	)
	if !parsed.RequireEmployer {
		t.Fatal("expected require employer")
	}
	if parsed.Location != "Berlin" {
		t.Fatalf("location = %q", parsed.Location)
	}
	if len(parsed.Skills) == 0 {
		t.Fatal("expected skills")
	}
	if len(parsed.Tools) == 0 {
		t.Fatal("expected tools")
	}
}

func TestProfileMentionsEmployer(t *testing.T) {
	corpus := "ex-devrelsquad | full stack developer in kolkata"
	if !profileMentionsEmployer(corpus, "devrelsquad") {
		t.Fatal("expected employer match")
	}
	if profileMentionsEmployer("typescript developer only", "devrelsquad") {
		t.Fatal("expected no employer match")
	}
}

func TestProfileMatchesRequirementsEmployer(t *testing.T) {
	parsed := ParseRecruiterQuery("worked at devrelsquad")
	ok, _ := profileMatchesRequirements("random developer bio", parsed)
	if ok {
		t.Fatal("expected filter out")
	}
	ok, signals := profileMatchesRequirements("ASE @ DevRelSquad | typescript", parsed)
	if !ok || len(signals) == 0 {
		t.Fatal("expected employer match with signals")
	}
}
