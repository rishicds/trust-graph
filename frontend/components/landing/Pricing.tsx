"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

import { ContactSalesModal } from "@/components/landing/ContactSalesModal";
import { routes } from "@/constants";
import { pricingSection, pricingTiers } from "@/lib/data";

export function Pricing() {
  const [salesOpen, setSalesOpen] = useState(false);
  const mainTiers = pricingTiers.filter((t) => !t.horizontal);
  const recruiterTier = pricingTiers.find((t) => t.horizontal);

  return (
    <section id="pricing" className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
            {pricingSection.label}
          </p>
          <h2 className="section-title mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            {pricingSection.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {pricingSection.subtitle}
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
          {mainTiers.map((tier) => (
            <article
              key={tier.name}
              className={
                tier.featured
                  ? "relative flex flex-col overflow-hidden rounded-[20px] bg-teal text-white shadow-[var(--shadow-md)]"
                  : "flex flex-col rounded-[20px] border border-border bg-white p-8 shadow-[var(--shadow-sm)]"
              }
            >
              {tier.featured && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(123,225,59,0.18), transparent)",
                  }}
                />
              )}

              <div className={tier.featured ? "relative flex flex-1 flex-col p-8" : "flex flex-1 flex-col"}>
                <div className="mb-6 flex h-7 items-center justify-center">
                  {tier.featured ? (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
                      Most popular
                    </span>
                  ) : null}
                </div>

                <p
                  className={
                    tier.featured
                      ? "text-sm font-semibold uppercase tracking-widest text-white/70"
                      : "text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]"
                  }
                >
                  {tier.name}
                </p>
                <p className="mt-3 text-5xl font-bold tracking-tight">
                  {tier.price}
                  {tier.priceNote && (
                    <span
                      className={
                        tier.featured
                          ? "text-lg font-normal text-white/70"
                          : "text-lg font-normal text-[var(--text-muted)]"
                      }
                    >
                      {tier.priceNote}
                    </span>
                  )}
                </p>
                <p
                  className={
                    tier.featured
                      ? "mt-2 text-sm text-white/75"
                      : "mt-2 text-sm text-[var(--text-secondary)]"
                  }
                >
                  {tier.description}
                </p>

                <ul
                  className={
                    tier.featured
                      ? "mt-8 space-y-3 text-sm text-white/90"
                      : "mt-8 space-y-3 text-sm text-[var(--text-secondary)]"
                  }
                >
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${tier.featured ? "text-accent" : "text-teal"}`}
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={routes.signUp}
                  className={
                    tier.featured
                      ? "mt-auto inline-flex w-full items-center justify-center rounded-[14px] bg-accent px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover"
                      : "mt-auto inline-flex w-full items-center justify-center rounded-[14px] border border-border bg-[var(--bg-surface-secondary)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-teal/30 hover:bg-white hover:shadow-[var(--shadow-xs)]"
                  }
                >
                  {tier.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>

        {recruiterTier && (
          <div className="mx-auto mt-6 flex max-w-4xl flex-col items-start justify-between gap-6 rounded-[20px] border border-border bg-[var(--bg-surface-secondary)] p-8 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {recruiterTier.name}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {recruiterTier.price}
                <span className="text-base font-normal text-[var(--text-muted)]">
                  {recruiterTier.priceNote}
                </span>
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{recruiterTier.description}</p>
            </div>
            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="flex flex-wrap gap-2">
                {recruiterTier.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs text-[var(--text-secondary)]"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSalesOpen(true)}
                className="inline-flex rounded-[14px] border border-border bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-teal/30 hover:shadow-[var(--shadow-xs)]"
              >
                {recruiterTier.ctaLabel}
              </button>
            </div>
          </div>
        )}
      </div>

      <ContactSalesModal open={salesOpen} onClose={() => setSalesOpen(false)} />
    </section>
  );
}
