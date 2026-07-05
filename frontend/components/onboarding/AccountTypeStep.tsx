"use client";

import { AccountType, accountTypeOptions, professionalSegments } from "@/constants/segments";
import { surfaces, typography } from "@/constants/styles";
import { Button } from "@/components/ui/Button";

type Props = {
  loading?: boolean;
  onSelect: (type: AccountType) => void;
};

export function AccountTypeStep({ loading, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Before we start</p>
        <h2 className={`mt-2 ${typography.sectionTitle}`}>How will you use TrustGraph?</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Choose your path. Trust Passport is for builders who want a portable reputation link. Recruiter is for
          hiring teams searching verified talent.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {accountTypeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={loading}
            onClick={() => onSelect(option.id)}
            className={`${surfaces.cardPadded} group text-left transition hover:border-teal/40 hover:shadow-md disabled:opacity-60`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">{option.subtitle}</p>
            <h3 className="mt-2 text-xl font-semibold text-ink group-hover:text-teal">{option.title}</h3>
            <p className="mt-3 text-sm text-muted">{option.description}</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-teal">Continue →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SegmentPicker({
  title,
  subtitle,
  loading,
  onSelect,
}: {
  title: string;
  subtitle: string;
  loading?: boolean;
  onSelect: (segment: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">{subtitle}</p>
        <h2 className={`mt-2 ${typography.sectionTitle}`}>{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">
          Phase 1 supports developers first. Other professional segments unlock as evidence sources go live.
        </p>
      </div>

      <div className="grid gap-3">
        {professionalSegments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            disabled={loading || !segment.enabled}
            onClick={() => segment.enabled && onSelect(segment.id)}
            className={`${surfaces.cardPadded} flex items-start justify-between gap-4 text-left transition ${
              segment.enabled
                ? "hover:border-teal/40 hover:shadow-md"
                : "cursor-not-allowed opacity-70"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-ink">{segment.label}</h3>
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
                  {segment.phase}
                </span>
                {!segment.enabled && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">{segment.description}</p>
            </div>
            {segment.enabled && <span className="text-sm font-semibold text-teal">Select</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
