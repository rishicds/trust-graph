package avatars

import (
	"net/url"
	"strings"
)

// Resolve returns avatarURL when set, otherwise a deterministic fun placeholder.
func Resolve(handle, avatarURL string) string {
	if strings.TrimSpace(avatarURL) != "" {
		return avatarURL
	}
	seed := handle
	if seed == "" {
		seed = "trustgraph"
	}
	return "https://api.dicebear.com/9.x/fun-emoji/png?seed=" + url.QueryEscape(seed) + "&size=256"
}
