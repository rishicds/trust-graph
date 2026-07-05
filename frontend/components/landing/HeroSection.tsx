"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

import { HeroGitHubPreview } from "@/components/landing/HeroGitHubPreview";
import { LottiePlayer } from "@/components/lottie/LottiePlayer";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { RetroGrid } from "@/components/ui/retro-grid";
import { routes, sampleProfileHandle } from "@/constants";
import { lottieAssets, lottieSizes } from "@/constants/lottie";
import { heroContent } from "@/lib/data";
import { gsap } from "@/lib/gsap";
import { splitChars } from "@/lib/split-chars";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".hero-headline .char", {
        opacity: 0,
        y: 40,
        rotateX: -30,
        stagger: 0.018,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.3,
      });

      gsap.from(".hero-sub", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.55,
      });

      gsap.to(".float-card", {
        y: -10,
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.6,
      });
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-[var(--bg-primary)]">
      <RetroGrid className="opacity-[0.06]" lineColor="rgba(17,17,17,0.4)" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(123,225,59,0.14),transparent)]" />

      <div className="relative z-10 hidden lg:block">
        <div className="float-card absolute left-[max(1rem,calc(50%-520px))] top-[38%] w-44 rounded-2xl border border-border bg-white/80 p-3 shadow-[var(--shadow-md)] backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-light text-xs font-semibold text-teal">
              R
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">@rishicds</p>
              <p className="text-[11px] text-[var(--text-muted)]">Trust Score: 95</p>
            </div>
          </div>
        </div>
        <div className="float-card absolute right-[max(1rem,calc(50%-480px))] top-[28%] rounded-2xl border border-border bg-white/80 p-3 shadow-[var(--shadow-md)] backdrop-blur-sm">
          <p className="text-[11px] text-[var(--text-muted)]">Evidence</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            88<span className="text-sm font-normal text-[var(--text-muted)]">/100</span>
          </p>
        </div>
        <div className="float-card absolute bottom-[28%] right-[max(1rem,calc(50%-440px))]">
          <LottiePlayer
            src={lottieAssets.heroShield}
            loop
            style={{ width: lottieSizes.hero, height: lottieSizes.hero }}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-3xl px-4 pb-12 pt-20 text-center sm:px-6 sm:pt-24 md:pt-28">
        <div className="mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-[var(--text-secondary)] shadow-[var(--shadow-xs)] sm:px-4 sm:text-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <AnimatedShinyText className="text-[var(--text-secondary)]">
            {heroContent.badge}
          </AnimatedShinyText>
        </div>

        <h1 className="hero-headline mx-auto w-full min-w-0 max-w-[900px] text-[clamp(2rem,9vw,6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-[var(--text-primary)] sm:text-[clamp(2.75rem,7vw,6rem)]">
          <span className="md:hidden">
            {heroContent.titleLine1}
            <br />
            <span className="text-[var(--text-secondary)]">{heroContent.titleLine2}</span>
          </span>
          <span className="hidden md:contents">
            <span className="block">{splitChars(heroContent.titleLine1)}</span>
            <span className="block text-[var(--text-secondary)]">
              {splitChars(heroContent.titleLine2)}
            </span>
          </span>
        </h1>

        <p className="hero-sub mx-auto mt-6 w-full min-w-0 max-w-[580px] text-base font-normal leading-[1.7] text-[var(--text-secondary)] sm:text-lg">
          {heroContent.subhead}
        </p>

        <div className="relative z-20 mx-auto mt-10 w-full max-w-2xl">
          <HeroGitHubPreview />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={routes.signUp}
            className="inline-flex items-center gap-2 rounded-[14px] bg-accent px-7 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover"
          >
            {heroContent.primaryCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={routes.sampleProfile(sampleProfileHandle)}
            className="inline-flex items-center rounded-[14px] border border-border bg-white px-7 py-3 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-sm)]"
          >
            {heroContent.secondaryCta}
          </Link>
        </div>

        <p className="mt-4 text-sm text-[var(--text-muted)]">{heroContent.proofLine}</p>
      </div>
    </section>
  );
}
