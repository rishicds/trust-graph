"use client";

import {
  Code2,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Layers,
  Link2,
  Mic2,
  Presentation,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { platformLogos, stats } from "@/lib/data";
import type { StatIcon } from "@/types/trust";

const statIcons: Record<StatIcon, LucideIcon> = {
  users: Users,
  files: FileText,
  globe: Globe,
  timer: Timer,
};

const platformIcons: Record<string, LucideIcon> = {
  GitHub: Code2,
  "Stack Overflow": Layers,
  Devpost: Trophy,
  LinkedIn: Link2,
  "Google Scholar": GraduationCap,
  arXiv: FileText,
  Sessionize: Mic2,
  Devfolio: FolderOpen,
  "Conference talks": Presentation,
};

function StatValue({ stat }: { stat: (typeof stats)[number] }) {
  const valueClass = "text-5xl font-bold leading-none text-[var(--text-primary)]";

  if (stat.format === "text") {
    return (
      <span className={valueClass}>
        {stat.prefix ?? ""}
        {stat.value}
        {stat.suffix ?? ""}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline ${valueClass}`}>
      {stat.prefix && <span>{stat.prefix}</span>}
      <NumberTicker value={stat.value} className="inline tabular-nums" />
      {stat.suffix && <span>{stat.suffix}</span>}
    </span>
  );
}

export function SocialProof() {
  return (
    <>
      <section className="border-y border-border bg-white py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = statIcons[stat.icon];
            return (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
                  <Icon className="h-4 w-4 text-teal" strokeWidth={2} aria-hidden />
                </div>
                <div className="inline-flex max-w-full items-baseline leading-none">
                  <span className="mr-0.5 font-mono text-xs text-accent">[</span>
                  <StatValue stat={stat} />
                  <span className="ml-0.5 font-mono text-xs text-accent">]</span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-b border-border bg-[var(--bg-surface-secondary)] py-6">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Evidence aggregated from platforms developers already use
        </p>
        <Marquee pauseOnHover className="gap-6 [--duration:30s]">
          {platformLogos.map((name) => {
            const PlatformIcon = platformIcons[name] ?? Code2;
            return (
              <span
                key={name}
                className="mx-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                <PlatformIcon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                {name}
              </span>
            );
          })}
        </Marquee>
      </section>
    </>
  );
}
