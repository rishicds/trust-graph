package config

import "strings"

func (c *Config) AdminEmails() []string {
	raw := strings.TrimSpace(getEnv("ADMIN_EMAILS", "notyourcode8@gmail.com,rishipaulstudy@gmail.com"))
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

func (c *Config) IsAdminEmail(email string) bool {
	e := strings.ToLower(strings.TrimSpace(email))
	if e == "" {
		return false
	}
	for _, admin := range c.AdminEmails() {
		if admin == e {
			return true
		}
	}
	return false
}
