package alerts

import (
	"fmt"
	"time"

	"github.com/trustgraph/backend/internal/models"
)

func BuildActivityAlerts(profile *models.Profile) []models.ActivityAlert {
	now := time.Now().UTC()
	alerts := make([]models.ActivityAlert, 0, 3)

	if profile.TrustScore.Delta < -2 {
		alerts = append(alerts, models.ActivityAlert{
			Type:      "score_decay",
			Message:   fmt.Sprintf("Trust score dropped %.1f points since last sync", -profile.TrustScore.Delta),
			Delta:     profile.TrustScore.Delta,
			CreatedAt: now,
		})
	} else if profile.TrustScore.Delta > 2 {
		alerts = append(alerts, models.ActivityAlert{
			Type:      "score_gain",
			Message:   fmt.Sprintf("Trust score increased %.1f points — new evidence indexed", profile.TrustScore.Delta),
			Delta:     profile.TrustScore.Delta,
			CreatedAt: now,
		})
	}

	daysSince := time.Since(profile.LastActivityAt).Hours() / 24
	if daysSince > 60 {
		alerts = append(alerts, models.ActivityAlert{
			Type:      "inactivity",
			Message:   fmt.Sprintf("No public activity detected in %.0f days — consistency score may decay", daysSince),
			CreatedAt: now,
		})
	}

	peerCount := 0
	for _, e := range profile.Evidence {
		if e.Type == "peer_reference" && e.Verified {
			peerCount++
		}
	}
	if peerCount < 2 {
		alerts = append(alerts, models.ActivityAlert{
			Type:      "peer_pending",
			Message:   "Invite peers to verify your skills and unlock the peer verification dimension",
			CreatedAt: now,
		})
	}

	return alerts
}
