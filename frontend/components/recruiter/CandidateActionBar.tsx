"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Github, Search, Star } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { brand, routes } from "@/constants";
import type { CandidateSearchResult } from "@/lib/api";

type Props = {
  candidate: CandidateSearchResult;
  onToggleStar?: (handle: string, starred: boolean) => void;
  onDeepSearch?: (handle: string) => Promise<void>;
  starring?: boolean;
  deepSearching?: boolean;
};

export function CandidateActionBar({
  candidate,
  onToggleStar,
  onDeepSearch,
  starring,
  deepSearching,
}: Props) {
  const [copied, setCopied] = useState(false);
  const passportUrl = brand.passportUrl(candidate.handle);
  const githubUrl = `https://github.com/${candidate.handle}`;

  async function copyPassportLink() {
    try {
      await navigator.clipboard.writeText(passportUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-[#FAFAFA] px-6 py-4">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Actions</span>
      <Button href={routes.sampleProfile(candidate.handle)} className="px-3 py-1.5 text-xs">
        View passport
      </Button>
      {onToggleStar && (
        <button
          type="button"
          disabled={starring}
          onClick={() => onToggleStar(candidate.handle, !candidate.starred)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal/40 disabled:opacity-50"
        >
          <Star className={candidate.starred ? "h-3.5 w-3.5 fill-teal text-teal" : "h-3.5 w-3.5 text-muted"} />
          {candidate.starred ? "Starred" : "Star for review"}
        </button>
      )}
      {onDeepSearch && (
        <button
          type="button"
          disabled={deepSearching}
          onClick={() => void onDeepSearch(candidate.handle)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-light px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal hover:text-white disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" />
          {deepSearching ? "Starting deep search…" : "Run deep search"}
        </button>
      )}
      <Link
        href={`${routes.sampleProfile(candidate.handle)}?recruiter=1`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal/40"
      >
        Recruiter report
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        onClick={() => void copyPassportLink()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal/40"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Copied!" : "Copy passport link"}
      </button>
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal/40"
      >
        <Github className="h-3.5 w-3.5" />
        GitHub
      </a>
    </div>
  );
}
