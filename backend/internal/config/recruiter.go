package config

import "strings"

func (c *Config) RecruiterUnlimitedEmails() []string {
	raw := strings.TrimSpace(getEnv("RECRUITER_UNLIMITED_EMAILS", "rishipaulstudy@gmail.com"))
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		e := strings.ToLower(strings.TrimSpace(p))
		if e != "" {
			out = append(out, e)
		}
	}
	return out
}

func (c *Config) IsRecruiterUnlimitedEmail(email string) bool {
	e := strings.ToLower(strings.TrimSpace(email))
	if e == "" {
		return false
	}
	for _, allowed := range c.RecruiterUnlimitedEmails() {
		if allowed == e {
			return true
		}
	}
	return false
}
