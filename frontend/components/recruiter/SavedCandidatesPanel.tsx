"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { routes } from "@/constants";
import { surfaces } from "@/constants/styles";
import type { RecruiterSavedCandidate } from "@/lib/api";

export function SavedCandidatesPanel({
  saved,
  loading,
  onRemove,
}: {
  saved: RecruiterSavedCandidate[];
  loading: boolean;
  onRemove: (handle: string) => void;
}) {
  if (loading) {
    return <div className={`${surfaces.cardPadded} text-muted`}>Loading starred candidates…</div>;
  }

  if (saved.length === 0) {
    return (
      <div className={`${surfaces.cardPadded} text-muted`}>
        No starred candidates yet. Star profiles from search results to review them here later.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {saved.map((item) => (
        <article key={item.handle} className={`${surfaces.cardPadded} flex flex-wrap items-start gap-4`}>
          {item.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatar_url} alt="" className="h-14 w-14 rounded-xl border border-border object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-light text-lg font-semibold text-teal">
              {item.display_name?.[0] ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{item.display_name}</h2>
              <span className="rounded-full bg-teal-light px-2 py-0.5 text-[10px] font-semibold uppercase text-teal">
                Starred
              </span>
            </div>
            <p className="text-sm text-muted">@{item.handle}</p>
            {item.headline && <p className="mt-1 text-sm">{item.headline}</p>}
            {item.saved_from_query && (
              <p className="mt-2 text-xs text-muted">Saved from: &ldquo;{item.saved_from_query}&rdquo;</p>
            )}
            <p className="mt-1 font-mono text-xs text-muted">
              Trust {item.trust_score.toFixed(0)} · {item.evidence_count} evidence
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href={routes.sampleProfile(item.handle)} variant="secondary">
              View passport
            </Button>
            <button
              type="button"
              onClick={() => onRemove(item.handle)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:border-red-300 hover:text-red-600"
            >
              <Star className="h-3.5 w-3.5 fill-teal text-teal" />
              Unstar
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
