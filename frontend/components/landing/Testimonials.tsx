"use client";

import { Marquee } from "@/components/ui/marquee";
import { testimonials, testimonialsSection } from "@/lib/data";

function TestimonialCard({ item }: { item: (typeof testimonials)[number] }) {
  const parts = item.quote.split(item.boldPhrase);
  return (
    <article className="w-[340px] shrink-0 rounded-[20px] border border-border bg-white p-6 shadow-[var(--shadow-xs)]">
      <p className="text-sm leading-[1.7] text-[var(--text-secondary)]">
        &ldquo;{parts[0]}
        <strong className="text-[var(--text-primary)]">{item.boldPhrase}</strong>
        {parts[1]}&rdquo;
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-[var(--border-soft)] pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-teal">
            {item.initials}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {item.role} · {item.city}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-teal-light px-2 py-1 text-xs font-medium text-teal">
          ↑{item.score}
        </span>
      </div>
    </article>
  );
}

export function Testimonials() {
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="border-y border-border bg-[var(--bg-surface-secondary)] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="section-label text-center text-xs font-semibold uppercase tracking-widest text-teal">
          {testimonialsSection.label}
        </p>
        <h2 className="section-title mt-3 text-center text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          {testimonialsSection.title}
        </h2>
      </div>
      <Marquee pauseOnHover className="mt-12 gap-5 [--duration:50s]" repeat={2}>
        {doubled.map((item, index) => (
          <TestimonialCard key={`${item.initials}-${index}`} item={item} />
        ))}
      </Marquee>
    </section>
  );
}
