"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import { LottiePlayer } from "@/components/lottie/LottiePlayer";
import { DotPattern } from "@/components/ui/dot-pattern";
import { lottieSizes } from "@/constants/lottie";
import { principleCards, principlesSection } from "@/lib/data";
import { gsap } from "@/lib/gsap";

export function Principles() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".principle-lottie", {
        scrollTrigger: { trigger: ".principles-grid", start: "top 75%", once: true },
        scale: 0.7,
        opacity: 0,
        stagger: 0.15,
        duration: 0.5,
        ease: "back.out(1.5)",
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-[var(--bg-surface-secondary)] py-24 md:py-28">
      <DotPattern className="absolute inset-0 opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
          {principlesSection.label}
        </p>
        <h2 className="section-title mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          {principlesSection.title}
        </h2>

        <div className="principles-grid mt-14 grid gap-5 md:grid-cols-3">
          {principleCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[24px] border border-border bg-white p-8 transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <LottiePlayer
                src={card.lottie}
                playOnVisible
                className="principle-lottie"
                style={{ width: lottieSizes.card, height: lottieSizes.card }}
              />
              <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
