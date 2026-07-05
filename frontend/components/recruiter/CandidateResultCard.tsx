"use client";

import { ExternalLink, Sparkles } from "lucide-react";

import { CandidateActionBar } from "@/components/recruiter/CandidateActionBar";
import { scoreDimensionMeta } from "@/constants/score";
import { surfaces } from "@/constants/styles";
import type { CandidateSearchResult } from "@/lib/api";
import { cn } from "@/lib/utils";

const categoryStyles: Record<string, string> = {
  query: "bg-teal-light text-teal",
  location: "bg-sky-50 text-sky-800",
  leadership: "bg-violet-50 text-violet-800",
  evidence: "bg-accent-soft text-[#2d5016]",
  ai_insight: "bg-amber-50 text-amber-800",
  role: "bg-indigo-50 text-indigo-800",
  capability: "bg-emerald-50 text-emerald-800",
  employer: "bg-orange-50 text-orange-800",
  web: "bg-slate-100 text-slate-700",
  trust: "bg-teal-light text-teal",
  identity: "bg-[#F5F5F5] text-ink",
  headline: "bg-[#F5F5F5] text-ink",
  timeline: "bg-[#F5F5F5] text-muted",
};

function categoryLabel(category: string) {
  return category.replace(/_/g, " ");
}

export function CandidateResultCard({
  candidate,
  rank,
  onToggleStar,
  onDeepSearch,
  starring,
  deepSearching,
}: {
  candidate: CandidateSearchResult;
  rank: number;
  onToggleStar?: (handle: string, starred: boolean) => void;
  onDeepSearch?: (handle: string) => Promise<void>;
  starring?: boolean;
  deepSearching?: boolean;
}) {
  const summary = candidate.match_summary || candidate.match_reason;
  const signals = candidate.matched_signals ?? [];
  const highlights = candidate.match_highlights ?? [];
  const dimensions = candidate.trust_score.dimensions;

  return (
    <article className={`${surfaces.cardPadded} overflow-hidden p-0`}>
      <div className="border-b border-border bg-[#FAFAFA] px-6 py-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="relative shrink-0">
              {candidate.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={candidate.avatar_url}
                  alt=""
                  className="h-16 w-16 rounded-2xl border border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-light text-xl font-semibold text-teal">
                  {candidate.display_name?.[0] ?? "?"}
                </div>
              )}
              <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                #{rank}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-ink">{candidate.display_name}</h2>
                {candidate.is_shadow && (
                  <span className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Shadow passport
                  </span>
                )}
                {candidate.discovery_source === "web" && (
                  <span className="rounded-full border border-teal/30 bg-teal-light px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
                    Web discovered
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">@{candidate.handle}</p>
              {candidate.headline && <p className="mt-2 text-sm leading-snug">{candidate.headline}</p>}
              {candidate.capabilities && candidate.capabilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.capabilities.slice(0, 5).map((cap) => (
                    <span
                      key={cap.name}
                      className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-[#2d5016]"
                    >
                      {cap.name}
                      {cap.evidence_count > 0 ? ` · ${cap.evidence_count} evidence` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            <div className="rounded-2xl bg-teal-light px-5 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-teal">Trust score</p>
              <p className="text-3xl font-bold text-ink">{candidate.trust_score.overall.toFixed(0)}</p>
              <p className="mt-1 text-[10px] text-muted">{candidate.evidence_count} evidence items</p>
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">Why recommended</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{summary}</p>
            </div>
          </div>
        </div>
      )}

      {signals.length > 0 && (
        <div className="border-b border-border px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Matched signals</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {signals.map((signal, index) => (
              <div
                key={`${signal.category}-${signal.label}-${index}`}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      categoryStyles[signal.category] ?? "bg-[#F5F5F5] text-muted",
                    )}
                  >
                    {categoryLabel(signal.category)}
                  </span>
                  {typeof signal.weight === "number" && signal.weight > 0 && (
                    <span className="font-mono text-[10px] text-muted">+{Math.round(signal.weight)}</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{signal.label}</p>
                <p className="mt-1 text-sm leading-snug text-muted">{signal.detail}</p>
                {(signal.source || signal.url) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {signal.source && <span>Source: {signal.source}</span>}
                    {signal.url && (
                      <a
                        href={signal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-teal hover:underline"
                      >
                        View proof
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="border-b border-border px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Evidence highlights</p>
          <ul className="mt-3 space-y-2">
            {highlights.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-snug text-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {candidate.ai_summary && (
        <div className="border-b border-border px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">AI profile read</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{candidate.ai_summary}</p>
        </div>
      )}

      <div className="grid gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {scoreDimensionMeta.map((dim) => {
          const value = dimensions[dim.key];
          return (
            <div key={dim.key} className="rounded-xl border border-border bg-[#FAFAFA] p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-ink">{dim.label}</p>
                <span className="font-mono text-xs font-semibold text-teal">{Math.round(value)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ECECEC]">
                <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, value)}%` }} />
              </div>
              <p className="mt-2 text-[10px] leading-snug text-muted">{dim.summary}</p>
            </div>
          );
        })}
      </div>

      <CandidateActionBar
        candidate={candidate}
        onToggleStar={onToggleStar}
        onDeepSearch={onDeepSearch}
        starring={starring}
        deepSearching={deepSearching}
      />
    </article>
  );
}
