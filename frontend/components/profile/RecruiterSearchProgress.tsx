"use client";

import { profile as profileCopy } from "@/constants";
import type { RecruiterFinding } from "@/lib/api";

type RecruiterSearchProgressProps = {
  status: string;
  progressPercent?: number;
  progressStep?: string;
  liveFindings?: RecruiterFinding[];
  backgroundHint?: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  stackoverflow: "Stack Overflow",
  devpost: "Devpost",
  talks: "Talks",
  web: "Web",
};

function platformLabel(platform?: string) {
  if (!platform) return "Web";
  return PLATFORM_LABELS[platform] ?? platform;
}

function statusPercent(status: string, progressPercent?: number) {
  if (typeof progressPercent === "number" && progressPercent > 0) {
    return Math.min(progressPercent, 100);
  }
  if (status === "queued") return 3;
  if (status === "running") return 8;
  return 0;
}

export function RecruiterSearchProgress({
  status,
  progressPercent,
  progressStep,
  liveFindings = [],
  backgroundHint,
}: RecruiterSearchProgressProps) {
  const percent = statusPercent(status, progressPercent);
  const step =
    progressStep ??
    (status === "queued" ? profileCopy.recruiter.queued : profileCopy.recruiter.running);

  return (
    <div className="mt-4 rounded-[16px] border border-border bg-white/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-wide text-muted">
        <span>{profileCopy.recruiter.progressLabel}</span>
        <span className="text-teal">{percent}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F1F1F1]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-accent transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <p className="mt-3 text-sm font-medium text-teal">{step}</p>

      {backgroundHint && (
        <p className="mt-2 text-xs text-muted">{backgroundHint}</p>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {profileCopy.recruiter.sourcesFound}
          {liveFindings.length > 0 && (
            <span className="ml-1.5 font-normal normal-case text-teal">
              ({liveFindings.length})
            </span>
          )}
        </p>

        {liveFindings.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{profileCopy.recruiter.waitingForSources}</p>
        ) : (
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
            {[...liveFindings].reverse().map((finding) => (
              <li
                key={finding.url}
                className="rounded-lg border border-border/60 bg-[#FAFAFA] px-3 py-2 text-sm transition-opacity duration-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={finding.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-teal hover:underline line-clamp-1"
                  >
                    {finding.title || finding.url}
                  </a>
                  <span className="shrink-0 rounded-full bg-teal-light px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal">
                    {platformLabel(finding.platform)}
                  </span>
                </div>
                {finding.snippet && (
                  <p className="mt-1 text-xs text-muted line-clamp-2">{finding.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
