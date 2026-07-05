package claim

import (
	"context"
	"fmt"
	"strings"

	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/trustgraph/backend/internal/service/clerkaccounts"
)

type VerificationResult struct {
	OK                bool   `json:"eligible"`
	Reason            string `json:"reason,omitempty"`
	Message           string `json:"message,omitempty"`
	RequiredGitHub    string `json:"required_github,omitempty"`
	ConnectedGitHub   string `json:"connected_github,omitempty"`
	GitHubConnected   bool   `json:"github_connected"`
	AlreadyHasProfile bool   `json:"already_has_profile"`
}

func GitHubUsernameFromClerk(ctx context.Context, clerkUserID string) (string, error) {
	if clerkUserID == "" {
		return "", fmt.Errorf("clerk user id required")
	}
	clerkUser, err := clerkuser.Get(ctx, clerkUserID)
	if err != nil {
		return "", err
	}
	accounts := clerkaccounts.Parse(clerkUser)
	return strings.ToLower(strings.TrimSpace(accounts.GitHubUsername)), nil
}

func VerifyGitHubHandleMatch(connectedGitHub, profileHandle string) VerificationResult {
	required := strings.ToLower(strings.TrimSpace(profileHandle))
	connected := strings.ToLower(strings.TrimSpace(connectedGitHub))

	if connected == "" {
		return VerificationResult{
			OK:              false,
			Reason:          "github_not_connected",
			Message:         "Connect the same GitHub account as this profile in your sign-in settings before claiming.",
			RequiredGitHub:  required,
			GitHubConnected: false,
		}
	}

	if connected != required {
		return VerificationResult{
			OK:              false,
			Reason:          "github_mismatch",
			Message:         fmt.Sprintf("Your connected GitHub (@%s) must match this profile (@%s).", connected, required),
			RequiredGitHub:  required,
			ConnectedGitHub: connected,
			GitHubConnected: true,
		}
	}

	return VerificationResult{
		OK:              true,
		RequiredGitHub:  required,
		ConnectedGitHub: connected,
		GitHubConnected: true,
	}
}

func VerifyGitHubConnect(connectedGitHub, requestedUsername string) error {
	result := VerifyGitHubHandleMatch(connectedGitHub, requestedUsername)
	if result.OK {
		return nil
	}
	return fmt.Errorf("%s", result.Message)
}
