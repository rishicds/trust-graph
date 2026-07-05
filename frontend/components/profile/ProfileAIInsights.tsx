"use client";

import { profile as profileCopy } from "@/constants";

export type ProfileInsight = {
  summary: string;
  highlights?: string[];
  role_signals?: string[];
  cross_platform_consistency?: string;
  gaps?: string[];
  source_urls?: string[];
  model?: string;
  generated_at: string;
};

export function ProfileAIInsights({
  insight,
  embedded = false,
  highlightsOnly = false,
}: {
  insight: ProfileInsight;
  embedded?: boolean;
  highlightsOnly?: boolean;
}) {
  const hasHighlights = Boolean(insight.highlights?.length);
  if (!hasHighlights && !highlightsOnly && !insight?.summary) return null;
  if (highlightsOnly && !hasHighlights && !insight.cross_platform_consistency) return null;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? undefined : "mt-8 border-t border-border pt-6"}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {profileCopy.aiInsight.title}
        </h2>
        {insight.cross_platform_consistency && (
          <span className="border border-teal/30 bg-teal-light px-2 py-0.5 text-[10px] font-medium text-teal">
            {profileCopy.aiInsight.consistency}: {insight.cross_platform_consistency}
          </span>
        )}
      </div>

      {!highlightsOnly && insight.summary && (
        <p className="text-sm leading-snug">{insight.summary}</p>
      )}

      {hasHighlights && (
        <ul
          className={
            !highlightsOnly && insight.summary
              ? "mt-2 grid gap-1 sm:grid-cols-2"
              : "grid gap-1 sm:grid-cols-2"
          }
        >
          {insight.highlights!.map((item) => (
            <li key={item} className="flex gap-1.5 text-xs leading-snug text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 bg-teal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {!highlightsOnly && insight.role_signals && insight.role_signals.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {insight.role_signals.map((role) => (
            <span
              key={role}
              className="border border-border bg-[#FAFAFA] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            >
              {role}
            </span>
          ))}
        </div>
      )}
    </Wrapper>
  );
}
