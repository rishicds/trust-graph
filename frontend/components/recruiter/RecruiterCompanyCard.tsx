"use client";

import { Building2, ExternalLink, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { routes } from "@/constants";
import { surfaces } from "@/constants/styles";
import type { RecruiterCompany } from "@/lib/api";

export function RecruiterCompanyCard({
  company,
  onRefresh,
  refreshing,
}: {
  company: RecruiterCompany | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  if (!company) {
    return (
      <div className={`${surfaces.cardPadded} border-amber-200 bg-amber-50/50`}>
        <p className="text-sm font-semibold text-ink">Company profile not linked</p>
        <p className="mt-2 text-sm text-muted">
          We couldn&apos;t load your company from onboarding. Re-run recruiter onboarding or contact
          support if you already submitted LinkedIn details.
        </p>
        <Button href={routes.recruiterOnboarding} variant="secondary" className="mt-4">
          Set up company again
        </Button>
      </div>
    );
  }

  return (
    <div className={`${surfaces.cardPadded}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-light text-teal">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <Building2 className="h-7 w-7" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-teal">Your company</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{company.name}</h2>
            {company.email && <p className="mt-1 text-sm text-muted">{company.email}</p>}
          </div>
        </div>
        {onRefresh && (
          <Button variant="secondary" disabled={refreshing} onClick={onRefresh}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh profile"}
          </Button>
        )}
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {company.industry && (
          <div>
            <dt className="text-muted">Industry</dt>
            <dd className="font-medium">{company.industry}</dd>
          </div>
        )}
        {company.location && (
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="font-medium">{company.location}</dd>
          </div>
        )}
        {(company.size || company.employee_count) && (
          <div>
            <dt className="text-muted">Size</dt>
            <dd className="font-medium">{company.size || company.employee_count}</dd>
          </div>
        )}
        {company.description && (
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-muted">About</dt>
            <dd className="mt-1 leading-relaxed">{company.description}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        {company.linkedin_url && (
          <a
            href={company.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-teal/40"
          >
            LinkedIn
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {company.website_url && (
          <a
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-teal/40"
          >
            Website
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
