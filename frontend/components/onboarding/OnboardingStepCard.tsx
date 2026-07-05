"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

function StepBadge({ step }: { step: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal">
      Step {step}
    </span>
  );
}

export function OnboardingStepCard({
  step,
  title,
  description,
  children,
  tourId,
  accent = false,
}: {
  step?: number;
  title: string;
  description?: string;
  children: ReactNode;
  tourId?: string;
  accent?: boolean;
}) {
  return (
    <section
      data-tour={tourId}
      className={`rounded-[24px] border p-6 shadow-[0_12px_40px_rgba(0,0,0,0.05)] sm:p-8 ${
        accent
          ? "border-teal/25 bg-gradient-to-br from-teal-light/40 to-white"
          : "border-border bg-white"
      }`}
    >
      <div className="mb-6">
        {step != null && <StepBadge step={step} />}
        <h2 className={`font-semibold tracking-tight ${step != null ? "mt-3 text-xl" : "text-xl"}`}>
          {title}
        </h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SourceTabButton({
  active,
  connected,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  connected: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "group flex min-h-[92px] w-full flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
        active
          ? "border-teal bg-teal text-white shadow-[0_8px_24px_rgba(15,110,104,0.22)]"
          : connected
            ? "border-teal/35 bg-teal-light/25 hover:-translate-y-0.5 hover:border-teal hover:shadow-sm"
            : "border-border bg-white hover:-translate-y-0.5 hover:border-teal/40 hover:bg-[#FAFAFA] hover:shadow-sm",
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
            active
              ? "bg-white/15 text-white"
              : connected
                ? "bg-teal/10 text-teal"
                : "bg-[#F3F3F3] text-muted group-hover:bg-teal/10 group-hover:text-teal",
          )}
        >
          {icon}
        </span>
        {connected && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              active ? "bg-white/15 text-white" : "bg-teal/15 text-teal",
            )}
          >
            Connected
          </span>
        )}
      </div>
      <div>
        <p className={cn("text-sm font-semibold leading-tight", !active && "text-[#111111]")}>
          {label}
        </p>
        {hint && (
          <p className={cn("mt-1 text-xs leading-snug", active ? "text-white/85" : "text-muted")}>
            {hint}
          </p>
        )}
      </div>
    </button>
  );
}

export function ConnectedBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-teal/20 bg-teal-light/30 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-white">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 8.5L6.5 12L13 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

export function InputRow({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit?: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
      onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
    >
      {children}
    </div>
  );
}
