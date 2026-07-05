"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Sparkles } from "lucide-react";

import { profile as profileCopy } from "@/constants";
import { surfaces } from "@/constants/styles";
import { cn } from "@/lib/utils";
import type { RecruiterReport } from "@/lib/api";

export function ProfileRecruiterReport({
  report,
  embedded = false,
  nested = false,
}: {
  report: RecruiterReport;
  embedded?: boolean;
  nested?: boolean;
}) {
  if (!report?.summary) return null;

  const [webFindingsOpen, setWebFindingsOpen] = useState(false);
  const scoreDelta = report.score_delta ?? report.score_after - report.score_before;
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={
        embedded ? (nested ? "mt-6" : undefined) : "mt-10 border-t border-border pt-10"
      }
    >
      {!nested && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {profileCopy.recruiter.title}
            </h2>
            <p className="mt-1 text-xs text-muted">{profileCopy.recruiter.subtitle}</p>
          </div>
          {report.cross_platform_consistency && (
            <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-medium text-teal">
              {profileCopy.aiInsight.consistency}: {report.cross_platform_consistency}
            </span>
          )}
        </div>
      )}
      {nested && report.cross_platform_consistency && (
        <div className="flex justify-end">
          <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-medium text-teal">
            {profileCopy.aiInsight.consistency}: {report.cross_platform_consistency}
          </span>
        </div>
      )}

      {scoreDelta !== 0 && (
        <p className={`text-sm font-medium text-teal ${nested ? "mt-0" : "mt-4"}`}>
          {profileCopy.recruiter.scoreUpdate}: {report.score_before.toFixed(1)} →{" "}
          {report.score_after.toFixed(1)}
          {scoreDelta > 0 ? ` (+${scoreDelta.toFixed(1)})` : ` (${scoreDelta.toFixed(1)})`}
        </p>
      )}

      <p className="mt-4 text-base leading-relaxed">{report.summary}</p>

      {report.highlights && report.highlights.length > 0 && (
        <ul className="mt-4 space-y-2">
          {report.highlights.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {report.hiring_signals && report.hiring_signals.length > 0 && (
        <div
          className={cn(
            surfaces.positivePanel,
            "mt-6 border border-accent/30 shadow-[0_8px_24px_rgba(123,225,59,0.12)]",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#2d5016]">
                {profileCopy.recruiter.hiringSignals}
              </h3>
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#2d5016]">
              {report.hiring_signals.length}
            </span>
          </div>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {report.hiring_signals.map((item) => {
              const colon = item.indexOf(":");
              const label = colon > 0 ? item.slice(0, colon).trim() : null;
              const detail = colon > 0 ? item.slice(colon + 1).trim() : item;

              return (
                <li
                  key={item}
                  className="flex gap-3 rounded-[14px] border border-white/60 bg-white/70 px-3.5 py-3 text-sm leading-snug"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-teal"
                    aria-hidden
                  />
                  <span className="text-[#1a3d0f]">
                    {label ? (
                      <>
                        <span className="font-semibold text-[#111111]">{label}</span>
                        <span className="text-[#2d5016]/90"> — {detail}</span>
                      </>
                    ) : (
                      detail
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {report.red_flags && report.red_flags.length > 0 && (
        <div className={cn(surfaces.negativePanel, "mt-5 border-amber-200/80 bg-[#FFFBF5]")}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900/70">
            {profileCopy.recruiter.redFlags}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-amber-900/90">
            {report.red_flags.map((item) => (
              <li key={item} className="flex gap-2 leading-snug">
                <span className="font-bold text-amber-700">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.role_signals && report.role_signals.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {report.role_signals.map((role) => (
            <span
              key={role}
              className="rounded-full border border-border bg-[#FAFAFA] px-3 py-1 text-xs font-medium"
            >
              {role}
            </span>
          ))}
        </div>
      )}

      {report.web_findings && report.web_findings.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setWebFindingsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {profileCopy.recruiter.webFindings}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {report.web_findings.length} source{report.web_findings.length === 1 ? "" : "s"}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted transition",
                webFindingsOpen && "rotate-180",
              )}
            />
          </button>
          {webFindingsOpen && (
            <ul className="mt-3 space-y-3">
              {report.web_findings.slice(0, 8).map((f) => (
                <li key={f.url} className="text-sm">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-teal hover:underline"
                  >
                    {f.title || f.url}
                  </a>
                  {f.snippet && (
                    <p className="mt-0.5 text-xs text-muted line-clamp-2">{f.snippet}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-4 text-[10px] uppercase tracking-wide text-muted">
        {profileCopy.recruiter.disclaimer}
        {report.model ? ` · ${report.model}` : ""}
      </p>
    </Wrapper>
  );
}
