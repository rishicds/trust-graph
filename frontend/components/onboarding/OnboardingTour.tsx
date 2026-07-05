"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EVENTS, STATUS, useJoyride } from "react-joyride";
import {
  getTourSteps,
  joyrideLocale,
  joyrideOptions,
  type WizardStep,
} from "@/constants/onboardingTour";

const TOUR_DISMISSED_KEY = "trustgraph-onboarding-tour-dismissed";

type OnboardingTourProps = {
  wizardStep: WizardStep;
  hasGitHub: boolean;
  /** Increment to replay the tour for the current step */
  replayToken?: number;
};

export function OnboardingTour({ wizardStep, hasGitHub, replayToken = 0 }: OnboardingTourProps) {
  const steps = useMemo(() => getTourSteps(wizardStep, hasGitHub), [wizardStep, hasGitHub]);
  const [run, setRun] = useState(false);

  const handleEvent = useCallback((data: { type: string; status: string }) => {
    if (
      data.type === EVENTS.TOUR_END &&
      (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED)
    ) {
      setRun(false);
      if (data.status === STATUS.SKIPPED) {
        try {
          localStorage.setItem(TOUR_DISMISSED_KEY, "1");
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const { Tour, controls } = useJoyride({
    steps,
    run,
    continuous: true,
    scrollToFirstStep: false,
    locale: joyrideLocale,
    options: {
      ...joyrideOptions,
      skipBeacon: true,
      showProgress: true,
      buttons: ["skip", "primary"],
    },
    onEvent: handleEvent,
  });

  // Only auto-start on first visit to step 1; otherwise tour is opt-in via "Guide me"
  useEffect(() => {
    if (replayToken > 0) {
      setRun(false);
      const timer = window.setTimeout(() => {
        setRun(true);
        controls.start(0);
      }, 200);
      return () => window.clearTimeout(timer);
    }

    if (wizardStep !== 1) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(TOUR_DISMISSED_KEY) === "1";
    } catch {
      // ignore
    }

    if (dismissed) return;

    const timer = window.setTimeout(() => {
      setRun(true);
      controls.start(0);
    }, 800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardStep, replayToken]);

  return Tour;
}

export function TourGuideButton({ onReplay }: { onReplay: () => void }) {
  return (
    <button
      type="button"
      onClick={onReplay}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-muted shadow-sm transition hover:border-teal/40 hover:text-teal"
      aria-label="Replay step guide"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Guide me
    </button>
  );
}
