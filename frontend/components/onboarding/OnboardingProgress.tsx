"use client";

import { WIZARD_STEP_COUNT } from "@/constants/onboardingTour";

type OnboardingProgressProps = {
  steps: readonly string[];
  current: number;
  maxReached: number;
  onStepClick?: (step: number) => void;
};

export function OnboardingProgress({
  steps,
  current,
  maxReached,
  onStepClick,
}: OnboardingProgressProps) {
  const progressPct = ((current - 1) / (WIZARD_STEP_COUNT - 1)) * 100;

  return (
    <nav
      data-tour="onboarding-progress"
      aria-label="Onboarding progress"
      className="mt-8 rounded-[20px] border border-border bg-white/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted">
        <span>Step {current} of {WIZARD_STEP_COUNT}</span>
        <span className="text-teal">{Math.round(progressPct)}% complete</span>
      </div>

      <ol className="relative flex items-start justify-between">
        <div
          className="absolute left-0 right-0 top-[18px] mx-4 h-0.5 bg-[#F1F1F1]"
          aria-hidden
        />
        <div
          className="absolute left-0 top-[18px] mx-4 h-0.5 bg-gradient-to-r from-teal to-accent transition-all duration-700 ease-out"
          style={{ width: `calc(${progressPct}% - 2rem)` }}
          aria-hidden
        />

        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isComplete = stepNum < current;
          const isCurrent = stepNum === current;
          const isClickable = stepNum <= maxReached && onStepClick;

          return (
            <li key={label} className="relative z-10 flex flex-1 flex-col items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(stepNum)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  isCurrent
                    ? "scale-110 bg-teal text-white shadow-[0_8px_24px_rgba(15,110,104,0.35)] ring-4 ring-teal-light"
                    : isComplete
                      ? "bg-accent text-[#111]"
                      : "border border-border bg-white text-muted"
                } ${isClickable && !isCurrent ? "cursor-pointer hover:scale-105 hover:border-teal/40" : "cursor-default"}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete && !isCurrent ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3 8.5L6.5 12L13 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  stepNum
                )}
              </button>
              <span
                className={`mt-2 hidden max-w-[88px] text-center text-[11px] font-medium leading-tight sm:block ${
                  isCurrent ? "text-teal" : isComplete ? "text-[#111]" : "text-muted"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-center text-sm font-medium text-teal sm:hidden">
        {steps[current - 1]}
      </p>
    </nav>
  );
}
