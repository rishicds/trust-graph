"use client";

import { Briefcase, Rocket, Search, type LucideIcon } from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";
import { problemCards, problemSection } from "@/lib/data";
import type { ProblemIcon } from "@/types/trust";

const problemIcons: Record<ProblemIcon, LucideIcon> = {
  search: Search,
  rocket: Rocket,
  briefcase: Briefcase,
};

export function Problem() {
  return (
    <section id="problem" className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
          {problemSection.label}
        </p>
        <h2 className="section-title mt-3 max-w-2xl text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          {problemSection.title}
        </h2>

        <div className="problem-grid mt-14 grid gap-5 md:grid-cols-3">
          {problemCards.map((card) => {
            const Icon = problemIcons[card.icon];
            return (
              <article
                key={card.title}
                className="problem-card group relative overflow-hidden rounded-[24px] border border-border bg-[var(--bg-surface-secondary)] p-7 transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <BorderBeam
                  size={80}
                  duration={8}
                  colorFrom="#7BE13B"
                  colorTo="#0F6E68"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                  <Icon className="h-5 w-5 text-teal" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {card.description}
                </p>
                <p className="mt-4 border-t border-[var(--border-soft)] pt-4 text-sm italic text-[var(--text-secondary)]">
                  &ldquo;{card.quote}&rdquo;
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
