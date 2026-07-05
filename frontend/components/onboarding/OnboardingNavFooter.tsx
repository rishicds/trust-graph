"use client";

import { Button } from "@/components/ui/Button";
import { onboarding } from "@/constants";
import { WIZARD_STEP_COUNT } from "@/constants/onboardingTour";

type OnboardingNavFooterProps = {
  wizardStep: number;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSkipSources?: () => void;
  onFinish?: () => void;
  onSkipToDashboard: () => void;
};

export function OnboardingNavFooter({
  wizardStep,
  canContinue,
  onBack,
  onContinue,
  onSkipSources,
  onFinish,
  onSkipToDashboard,
}: OnboardingNavFooterProps) {
  const isLast = wizardStep >= WIZARD_STEP_COUNT;

  return (
    <div className="mt-10 space-y-4">
      <div
        data-tour="nav-actions"
        className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-border bg-white/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:p-5"
      >
        <div className="flex flex-wrap gap-2">
          {wizardStep > 1 && (
            <Button variant="ghost" onClick={onBack}>
              {onboarding.nav.back}
            </Button>
          )}
          {wizardStep === 2 && onSkipSources && (
            <Button variant="ghost" onClick={onSkipSources}>
              {onboarding.nav.skipSources}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {!isLast ? (
            <Button onClick={onContinue} disabled={!canContinue} className="min-w-[140px]">
              {onboarding.nav.continue}
            </Button>
          ) : (
            <Button onClick={onFinish} className="min-w-[160px]">
              {onboarding.peer.finish}
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-muted">
        <button type="button" onClick={onSkipToDashboard} className="transition hover:text-[#111] hover:underline">
          {onboarding.skip}
        </button>
      </p>
    </div>
  );
}
