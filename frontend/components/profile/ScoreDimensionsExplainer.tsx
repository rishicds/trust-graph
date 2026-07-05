"use client";

import { scoreDimensionMeta, scoreOverview } from "@/constants/score";
import { cn } from "@/lib/utils";

type ScoreDimensionsExplainerProps = {
  variant?: "compact" | "profile" | "recruiter";
  className?: string;
  showOverview?: boolean;
  showWeights?: boolean;
};

export function ScoreDimensionsExplainer({
  variant = "compact",
  className,
  showOverview = variant !== "profile",
  showWeights = true,
}: ScoreDimensionsExplainerProps) {
  const isProfile = variant === "profile";
  const isRecruiter = variant === "recruiter";

  return (
    <div className={cn("space-y-3", className)}>
      {showOverview && (
        <div className={cn(isRecruiter ? "mb-5 border-b border-border pb-4" : "mb-4")}>
          <h3
            className={cn(
              "font-semibold text-[#111111]",
              isRecruiter ? "text-lg" : "text-sm",
            )}
          >
            {scoreOverview.title}
          </h3>
          <p className={cn("mt-1.5 leading-snug text-muted", isRecruiter ? "text-sm" : "text-xs")}>
            {scoreOverview.subtitle}
          </p>
          {showWeights && (
            <p className="mt-2 text-[11px] leading-snug text-muted">{scoreOverview.formula}</p>
          )}
          {isRecruiter && (
            <p className="mt-2 rounded-md border border-teal/20 bg-teal-light/40 px-3 py-2 text-xs leading-snug text-[#2d5016]">
              {scoreOverview.recruiterNote}
            </p>
          )}
        </div>
      )}

      <div
        className={cn(
          isProfile && "space-y-2 border-t border-border pt-3",
          isRecruiter && "grid gap-3 sm:grid-cols-2",
          variant === "compact" && "grid gap-2 sm:grid-cols-2",
        )}
      >
        {scoreDimensionMeta.map((dim) => (
          <div
            key={dim.key}
            className={cn(
              isProfile
                ? "grid grid-cols-[1fr_auto] items-start gap-x-2 gap-y-0.5 text-[10px]"
                : "rounded-lg border border-border bg-[#FAFAFA] p-3",
            )}
          >
            <div className={cn(!isProfile && "flex flex-wrap items-baseline justify-between gap-2")}>
              <p
                className={cn(
                  "font-medium text-[#111111]",
                  isProfile ? "truncate text-muted" : "text-sm",
                )}
              >
                {dim.label}
              </p>
              {showWeights && !isProfile && (
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-teal">
                  {dim.weight}
                </span>
              )}
            </div>

            {isProfile ? (
              <>
                <span className="sr-only">{dim.weight} weight</span>
                <p className="col-span-2 leading-snug text-muted">{dim.summary}</p>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-xs leading-snug text-muted">{dim.description}</p>
                <ul className="mt-2 space-y-1 text-[11px] leading-snug text-muted">
                  {dim.signals.map((signal) => (
                    <li key={signal} className="flex gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreDimensionBar({
  label,
  value,
  summary,
}: {
  label: string;
  value: number;
  summary?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-[10px]">
        <span className="truncate text-muted">{label}</span>
        <span className="font-mono font-medium">{value.toFixed(0)}</span>
        <div className="col-span-2 h-1 overflow-hidden bg-[#ECECEC]">
          <div className="h-full bg-teal" style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
      </div>
      {summary && <p className="text-[10px] leading-snug text-muted">{summary}</p>}
    </div>
  );
}
