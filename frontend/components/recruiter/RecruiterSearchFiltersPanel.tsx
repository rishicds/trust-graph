"use client";

import type { RecruiterSearchFilters } from "@/lib/api";

type Props = {
  filters: RecruiterSearchFilters;
  onChange: (filters: RecruiterSearchFilters) => void;
};

export function RecruiterSearchFiltersPanel({ filters, onChange }: Props) {
  return (
    <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-sm">
        <span className="font-medium text-ink">Min trust score</span>
        <input
          type="number"
          min={0}
          max={100}
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={filters.min_trust_score ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              min_trust_score: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="e.g. 70"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-ink">Source</span>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={filters.discovery_source ?? "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              discovery_source: e.target.value === "all" ? undefined : e.target.value,
            })
          }
        >
          <option value="all">Index + web</option>
          <option value="indexed">Indexed only</option>
          <option value="web">Web discovered only</option>
        </select>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-ink">Location filter</span>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={filters.location ?? ""}
          onChange={(e) => onChange({ ...filters, location: e.target.value || undefined })}
          placeholder="e.g. Kolkata"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-ink">Must mention employer</span>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={
            filters.require_employer === true
              ? "yes"
              : filters.require_employer === false
                ? "no"
                : "auto"
          }
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...filters,
              require_employer: v === "auto" ? undefined : v === "yes",
            });
          }}
        >
          <option value="auto">Auto-detect from prompt</option>
          <option value="yes">Required</option>
          <option value="no">Not required</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
        <input
          type="checkbox"
          checked={Boolean(filters.starred_only)}
          onChange={(e) => onChange({ ...filters, starred_only: e.target.checked || undefined })}
          className="h-4 w-4 rounded border-border text-teal"
        />
        <span className="font-medium text-ink">Show starred candidates only</span>
      </label>
    </div>
  );
}
