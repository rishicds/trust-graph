"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { architectureLayers, architectureSection } from "@/lib/data";

export function Architecture() {
  return (
    <section
      id="architecture"
      className="border-y border-border bg-[var(--bg-surface-secondary)] py-24 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
          {architectureSection.label}
        </p>
        <h2 className="section-title mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          {architectureSection.title}
        </h2>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {architectureLayers.map((layer) => (
            <article
              key={layer.title}
              className={`group relative overflow-hidden rounded-[24px] p-7 ${
                layer.accent
                  ? "bg-teal text-white"
                  : "border border-border bg-white"
              }`}
            >
              <BorderBeam
                size={80}
                duration={8}
                colorFrom={layer.accent ? "#ffffff" : "#7BE13B"}
                colorTo={layer.accent ? "#7BE13B" : "#0F6E68"}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
              <p className="text-6xl font-bold leading-none opacity-20">{layer.index}</p>
              <h3 className="mt-4 text-xl font-semibold">{layer.title}</h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  layer.accent ? "opacity-80" : "text-[var(--text-secondary)]"
                }`}
              >
                {layer.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
