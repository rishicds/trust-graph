package recruiter

import (
	"strings"

	"github.com/trustgraph/backend/internal/models"
)

func applySearchFilters(
	scored []scoredProfile,
	parsed models.ParsedRecruiterQuery,
	filters models.RecruiterSearchFilters,
	starredHandles map[string]struct{},
) []scoredProfile {
	out := make([]scoredProfile, 0, len(scored))
	for _, item := range scored {
		ok, reqSignals := profileMatchesRequirements(profileCorpus(item.profile), parsed)
		if !ok {
			continue
		}
		if len(reqSignals) > 0 {
			item.signals = append(reqSignals, item.signals...)
			for _, sig := range reqSignals {
				item.score += sig.Weight
			}
		}

		if filters.MinTrustScore > 0 && item.profile.TrustScore.Overall < filters.MinTrustScore {
			continue
		}
		switch strings.ToLower(strings.TrimSpace(filters.DiscoverySource)) {
		case "indexed":
			if item.discoverySource == "web" {
				continue
			}
		case "web":
			if item.discoverySource != "web" {
				continue
			}
		}
		if filters.StarredOnly {
			if _, ok := starredHandles[strings.ToLower(item.profile.Handle)]; !ok {
				continue
			}
		}
		out = append(out, item)
	}
	return out
}
