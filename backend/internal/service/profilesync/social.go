package profilesync

import (
	"github.com/trustgraph/backend/internal/models"
	githubsvc "github.com/trustgraph/backend/internal/service/github"
)

func mapSocialLinks(links githubsvc.SocialLinks) []models.SocialLink {
	out := make([]models.SocialLink, 0, 4)
	add := func(platform, url string) {
		if url != "" {
			out = append(out, models.SocialLink{Platform: platform, URL: url})
		}
	}
	add("website", links.Website)
	add("twitter", links.Twitter)
	add("linkedin", links.LinkedIn)
	add("github", links.GitHub)
	if len(out) == 0 {
		return nil
	}
	return out
}
