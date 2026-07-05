package enrichment

import (
	"context"
	"fmt"
	"log"
)

func (a *Agent) aiEnabled() bool {
	return a.nvidia.Enabled() || a.gemini.Enabled()
}

func (a *Agent) generateRecruiterInsights(ctx context.Context, systemPrompt, userPrompt string) (*RecruiterDraft, string, error) {
	var lastErr error

	if a.nvidia.Enabled() {
		draft, err := a.nvidia.GenerateRecruiterInsights(ctx, systemPrompt, userPrompt)
		if err == nil {
			return draft, a.nvidia.ModelName(), nil
		}
		lastErr = err
		log.Printf("enrichment: nvidia recruiter insights failed, trying gemini fallback: %v", err)
	}

	if a.gemini.Enabled() {
		draft, err := a.gemini.GenerateRecruiterInsights(ctx, systemPrompt, userPrompt)
		if err == nil {
			return draft, a.gemini.ModelName(), nil
		}
		lastErr = err
	}

	if lastErr != nil {
		return nil, "", lastErr
	}
	return nil, "", fmt.Errorf("NVIDIA_AI_API or GEMINI_API_KEY required for recruiter insights")
}

func (a *Agent) generateInsights(ctx context.Context, systemPrompt, userPrompt string) (*InsightDraft, string, error) {
	var lastErr error

	if a.nvidia.Enabled() {
		draft, err := a.nvidia.GenerateInsights(ctx, systemPrompt, userPrompt)
		if err == nil {
			return draft, a.nvidia.ModelName(), nil
		}
		lastErr = err
		log.Printf("enrichment: nvidia insights failed, trying gemini fallback: %v", err)
	}

	if a.gemini.Enabled() {
		draft, err := a.gemini.GenerateInsights(ctx, systemPrompt, userPrompt)
		if err == nil {
			return draft, a.gemini.ModelName(), nil
		}
		lastErr = err
	}

	if lastErr != nil {
		return nil, "", lastErr
	}
	return nil, "", fmt.Errorf("NVIDIA_AI_API or GEMINI_API_KEY required for insight generation")
}
