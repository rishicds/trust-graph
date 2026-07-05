"use client";

import Link from "next/link";

import { LottiePlayer } from "@/components/lottie/LottiePlayer";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { lottieSizes } from "@/constants/lottie";
import { routes } from "@/constants";
import {
  integrationInnerOrbit,
  integrationOuterOrbit,
  integrationSection,
} from "@/lib/data";

function OrbitNode({ label }: { label: string }) {
  return (
    <span className="whitespace-nowrap rounded-2xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)]">
      {label}
    </span>
  );
}

export function IntegrationEcosystem() {
  return (
    <section className="border-y border-border bg-[var(--bg-surface-secondary)] py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        <div className="relative mx-auto h-[320px] w-full max-w-[320px] overflow-hidden lg:mx-0">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 60% at 50% 50%, var(--glow-teal), transparent)",
            }}
          />
          <OrbitingCircles radius={72} duration={22}>
            {integrationInnerOrbit.map((name) => (
              <OrbitNode key={name} label={name} />
            ))}
          </OrbitingCircles>
          <OrbitingCircles radius={118} duration={36} reverse delay={2}>
            {integrationOuterOrbit.map((name) => (
              <OrbitNode key={name} label={name} />
            ))}
          </OrbitingCircles>
          <div className="absolute left-1/2 top-1/2 z-10 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border border-border bg-white shadow-[var(--shadow-sm)]">
            <LottiePlayer
              src={integrationSection.lottie}
              playOnVisible
              style={{ width: lottieSizes.hub, height: lottieSizes.hub }}
            />
          </div>
        </div>

        <div className="relative z-10">
          <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
            {integrationSection.label}
          </p>
          <h2 className="section-title mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            {integrationSection.title}
          </h2>
          <p className="mt-4 leading-[1.7] text-[var(--text-secondary)]">{integrationSection.body}</p>
          <ul className="mt-6 space-y-2">
            {integrationSection.bullets.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-teal">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={routes.signUp}
            className="mt-8 inline-flex rounded-[14px] bg-accent px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover"
          >
            {integrationSection.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
