"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

import { LottiePlayer } from "@/components/lottie/LottiePlayer";
import { routes, sampleProfileHandle } from "@/constants";
import { lottieSizes } from "@/constants/lottie";
import { finalCta } from "@/lib/data";
import { gsap } from "@/lib/gsap";

export function FinalCTA() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".cta-content > *", {
        scrollTrigger: { trigger: ".cta-section", start: "top 70%", once: true },
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      className="cta-section relative overflow-hidden bg-teal py-24 md:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(123,225,59,0.25), transparent)",
        }}
      />
      <div className="cta-content relative mx-auto max-w-3xl px-6 text-center">
        <LottiePlayer
          src={finalCta.lottie}
          playOnVisible
          className="cta-lottie mx-auto"
          style={{ width: lottieSizes.cta, height: lottieSizes.cta }}
        />
        <h2 className="text-[clamp(2.5rem,5vw,4.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-white">
          {finalCta.titleLine1}
          <br />
          {finalCta.titleLine2}
        </h2>
        <p className="mx-auto mt-6 max-w-[500px] text-lg font-normal text-white/70">
          {finalCta.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={routes.signUp}
            className="inline-flex items-center gap-2 rounded-[14px] bg-accent px-7 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover"
          >
            {finalCta.primaryCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={routes.sampleProfile(sampleProfileHandle)}
            className="inline-flex rounded-[14px] border border-white/30 px-7 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            {finalCta.secondaryCta}
          </Link>
        </div>
        <p className="mt-5 text-sm text-white/50">{finalCta.proofLine}</p>
      </div>
    </section>
  );
}
