"use client";

import { professionalSegments } from "@/constants/segments";
import { surfaces } from "@/constants/styles";

type Props = {
  value: string;
  loading?: boolean;
  onChange: (segment: string) => void;
};

export function HiringSegmentSelector({ value, loading, onChange }: Props) {
  const active =
    professionalSegments.find((segment) => segment.id === value) ?? professionalSegments[0];
  const enabled = professionalSegments.filter((segment) => segment.enabled);
  const upcoming = professionalSegments.filter((segment) => !segment.enabled);

  return (
    <div className={surfaces.cardPadded}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Hiring focus</p>
          <p className="mt-1 text-sm text-muted">
            Searching <span className="font-medium text-ink">{active.label.toLowerCase()}s</span> in
            Phase 1. Other segments unlock as evidence sources go live.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-teal-light px-3 py-1 text-xs font-semibold text-teal">
          {active.phase}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {enabled.map((segment) => {
          const selected = segment.id === active.id;
          return (
            <button
              key={segment.id}
              type="button"
              disabled={loading}
              aria-pressed={selected}
              onClick={() => onChange(segment.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                selected
                  ? "bg-teal text-white shadow-[0_4px_12px_rgba(15,110,104,0.25)]"
                  : "border border-border bg-white text-ink hover:border-teal/40"
              }`}
            >
              {segment.label}
              {selected ? " · active" : ""}
            </button>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Coming soon</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {upcoming.map((segment) => (
              <span
                key={segment.id}
                title={segment.description}
                className="cursor-default rounded-full border border-dashed border-border bg-[#FAFAFA] px-3 py-1.5 text-xs text-muted"
              >
                {segment.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
