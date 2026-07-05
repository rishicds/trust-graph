"use client";

import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";

import { profile as profileCopy } from "@/constants";
import { ProfileStat } from "@/lib/api";
import {
  groupStatsByPlatform,
  impactStats,
  platformLabel,
  renownStats,
} from "@/lib/profile-stats";
import { cn } from "@/lib/utils";

function StatCell({ stat }: { stat: ProfileStat }) {
  const content = (
    <>
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
        {stat.label}
      </p>
      <p className="mt-0.5 font-mono text-lg font-bold leading-none tabular-nums">{stat.display}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
        {stat.platform && stat.category !== "renown" && (
          <span className="uppercase tracking-wide">{platformLabel(stat.platform)}</span>
        )}
        {stat.verified && <span className="font-medium text-teal">{profileCopy.evidence.verified}</span>}
      </div>
    </>
  );

  const className =
    "group relative min-h-[72px] border-b border-r border-border bg-white p-2 transition hover:bg-[#FAFAFA]";

  if (stat.url) {
    return (
      <Link href={stat.url} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
        <ExternalLink className="absolute right-1.5 top-1.5 h-3 w-3 text-muted opacity-0 transition group-hover:opacity-100" />
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

type ProfileStatsGridProps = {
  stats: ProfileStat[];
  compact?: boolean;
  embedded?: boolean;
};

export function ProfileStatsGrid({ stats, compact = false, embedded = false }: ProfileStatsGridProps) {
  if (stats.length === 0) return null;

  const renown = renownStats(stats);
  const impact = impactStats(stats);
  const byPlatform = groupStatsByPlatform(stats);

  const flatStats: ProfileStat[] = [];
  for (const s of impact) flatStats.push(s);
  for (const [, platformStats] of byPlatform) {
    for (const s of platformStats) {
      if (s.category !== "impact") flatStats.push(s);
    }
  }

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={cn(!embedded && "mt-8 border-t border-border pt-6", compact && "mt-4 pt-4")}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-1.5">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {profileCopy.stats.title}
          </h2>
          <p className="text-[11px] text-muted">{profileCopy.stats.subtitle}</p>
        </div>
        {renown.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {renown.map((stat) => (
              <span
                key={stat.key}
                className="inline-flex items-center gap-1 border border-teal/30 bg-accent-soft/40 px-2 py-0.5 text-[10px] font-medium text-[#2d5016]"
              >
                <Sparkles className="h-3 w-3 text-teal" />
                {stat.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {flatStats.map((stat) => (
          <StatCell key={stat.key} stat={stat} />
        ))}
      </div>

      {byPlatform.map(([platform, platformStats]) => {
        const languages = platformStats.filter((s) => s.category === "language");
        if (languages.length === 0) return null;

        return (
          <div key={platform} className="mt-2 border-t border-border pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              {platformLabel(platform)} · {profileCopy.stats.languagesNote}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {languages.map((stat) => (
                <span
                  key={stat.key}
                  className="inline-flex items-center gap-1 border border-border bg-white px-2 py-0.5 text-[10px]"
                >
                  <span className="font-medium">{stat.label}</span>
                  <span className="font-mono text-muted">{stat.display}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </Wrapper>
  );
}
