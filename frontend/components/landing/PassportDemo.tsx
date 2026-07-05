"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";
import { useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  GitPullRequest,
  Layers,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { routes, sampleProfileHandle } from "@/constants";
import {
  passportDemo,
  passportDimensions,
  passportEvidence,
} from "@/lib/data";
import { gsap } from "@/lib/gsap";
import type { EvidenceItem } from "@/types/trust";

const sourceIcons: Record<EvidenceItem["source"], LucideIcon> = {
  github: Code2,
  stackoverflow: Layers,
  devpost: Code2,
  scholar: Code2,
  conference: Code2,
};

function SourceBadge({ item }: { item: EvidenceItem }) {
  const Icon = sourceIcons[item.source];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-medium text-teal shadow-[var(--shadow-xs)]">
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
      {item.sourceLabel}
      <Check className="h-3 w-3 text-accent" strokeWidth={2.5} aria-hidden />
    </span>
  );
}

export function PassportDemo() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".demo-left > *", {
        scrollTrigger: {
          trigger: ".demo-section",
          start: "top 70%",
        },
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
      });
    },
    { scope: sectionRef },
  );

  const { profile } = passportDemo;

  return (
    <section
      id="passport"
      ref={sectionRef}
      className="demo-section mx-auto max-w-7xl px-6 py-24 md:py-32"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_460px] lg:gap-20">
        <div className="demo-left order-2 lg:order-1">
          <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
            {passportDemo.label}
          </p>
          <h2 className="section-title mt-3 text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--text-primary)]">
            {passportDemo.title}
          </h2>
          <p className="mt-4 max-w-[420px] leading-[1.7] text-[var(--text-secondary)]">
            {passportDemo.body}
          </p>

          <ul className="mt-6 space-y-2.5">
            {passportDemo.bullets.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-[14px] border border-border bg-white px-4 py-3 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                  <Check className="h-3.5 w-3.5 text-teal" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="text-sm leading-relaxed text-[var(--text-secondary)]">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={routes.signUp}
              className="inline-flex items-center gap-2 rounded-[14px] bg-accent px-6 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover"
            >
              {passportDemo.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={routes.sampleProfile(sampleProfileHandle)}
              className="inline-flex items-center gap-2 rounded-[14px] border border-border bg-white px-6 py-3 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition hover:border-teal/30 hover:shadow-[var(--shadow-sm)]"
            >
              {passportDemo.exampleLink}
              <ArrowUpRight className="h-4 w-4 text-teal" />
            </Link>
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          <div
            className="pointer-events-none absolute -inset-6 rounded-[32px] opacity-70 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 40%, var(--glow-teal), transparent)",
            }}
          />
          <MagicCard className="relative rounded-[24px]">
            <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--bg-surface-secondary)] px-6 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-teal">
                  Trust Passport
                </span>
                <ShieldCheck className="h-4 w-4 text-teal" strokeWidth={2} aria-hidden />
              </div>

              <div className="px-6 pb-4 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      handle={profile.handle}
                      displayName={profile.name}
                      size="sm"
                      className="rounded-xl"
                    />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{profile.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">@{profile.handle}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-teal-light px-3 py-2 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-teal">
                      Trust Score
                    </p>
                    <div className="mt-0.5 flex items-end justify-end gap-1.5">
                      <NumberTicker value={profile.score} className="text-3xl font-bold leading-none" />
                      <span className="mb-0.5 inline-flex items-center gap-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                        <ArrowUpRight className="h-3 w-3" />
                        +{profile.delta}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 border-t border-[var(--border-soft)] px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Dimensions
                </p>
                {passportDimensions.map((dim, index) => (
                  <div key={dim.name}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-[var(--text-secondary)]">{dim.name}</span>
                      <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                        {dim.value}/100
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--border-soft)]">
                      <motion.div
                        className="h-full rounded-full bg-linear-to-r from-teal to-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${dim.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 bg-[var(--bg-surface-secondary)] px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Verified evidence
                </p>
                {passportEvidence.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-white px-3 py-2.5 text-sm shadow-[var(--shadow-xs)]"
                  >
                    <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-teal" strokeWidth={2} />
                      {item.label}
                    </span>
                    <SourceBadge item={item} />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border bg-white px-6 py-3">
                <span className="truncate font-mono text-xs text-[var(--text-muted)]">
                  {profile.url}
                </span>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-border bg-[var(--bg-surface-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-teal/30 hover:text-teal"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy link
                </button>
              </div>
            </div>
          </MagicCard>
        </div>
      </div>
    </section>
  );
}
