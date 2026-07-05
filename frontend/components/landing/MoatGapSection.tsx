"use client";

import { Check, Minus } from "lucide-react";

import { landing } from "@/constants";
import { layout, typography } from "@/constants/styles";

export function MoatGap() {
  const { gap } = landing;

  return (
    <section id="moat" className={`${layout.sectionWhite} border-t border-border`}>
      <div className={layout.containerMd}>
        <div className="max-w-2xl">
          <h2 className={typography.sectionTitleSm}>{gap.title}</h2>
          <p className={`mt-4 ${typography.body}`}>{gap.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{gap.solvedLabel}</p>
            <ul className="mt-4 divide-y divide-border rounded-[20px] border border-border bg-[#FAFAFA]">
              {gap.solved.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-light text-teal">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm text-muted">{item.outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[20px] border-2 border-teal/30 bg-white p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">{gap.unsolvedLabel}</p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight">{gap.unsolved.label}</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">{gap.unsolved.body}</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#111]">
              <Minus className="h-4 w-4 text-teal" />
              TrustGraph is built to be the winner in this category
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
