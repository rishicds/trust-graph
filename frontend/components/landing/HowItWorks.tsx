"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Layers,
  Timer,
  Trophy,
} from "lucide-react";

import { LottiePlayer } from "@/components/lottie/LottiePlayer";
import { BorderBeam } from "@/components/ui/border-beam";
import { lottieSizes } from "@/constants/lottie";
import { howItWorksSection, howItWorksSteps } from "@/lib/data";
import { gsap } from "@/lib/gsap";
import type { HowItWorksIcon } from "@/types/trust";

function ConnectPreview() {
  const sources = [
    { label: "GitHub", icon: Code2 },
    { label: "Stack Overflow", icon: Layers },
    { label: "Devpost", icon: Trophy },
  ];
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {sources.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] shadow-[var(--shadow-xs)]"
        >
          <Icon className="h-3 w-3 text-teal" strokeWidth={2} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}

function CollectPreview() {
  const items = ["88 merged PRs", "2 accepted answers", "1 hackathon win"];
  return (
    <ul className="mt-5 space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-center gap-2 rounded-[10px] border border-border bg-white px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)] shadow-[var(--shadow-xs)]"
        >
          <Check className="h-3 w-3 shrink-0 text-accent" strokeWidth={2.5} aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function SharePreview() {
  return (
    <div className="mt-5 rounded-[12px] border border-border bg-white p-2.5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-2 rounded-[8px] bg-[var(--bg-surface-secondary)] px-2.5 py-2">
        <span className="truncate font-mono text-[11px] text-[var(--text-muted)]">
          trustgraph.com/you
        </span>
        <span className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-teal">
          <Copy className="h-2.5 w-2.5" aria-hidden />
          Copy
        </span>
      </div>
    </div>
  );
}

const stepPreviews: Record<HowItWorksIcon, () => React.ReactNode> = {
  connect: ConnectPreview,
  collect: CollectPreview,
  share: SharePreview,
};

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".how-it-works-lottie", {
        scrollTrigger: { trigger: ".how-it-works-grid", start: "top 75%", once: true },
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
    <section id="how-it-works" ref={ref} className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
            {howItWorksSection.label}
          </p>
          <h2 className="section-title mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            {howItWorksSection.title}
          </h2>
          <p className="mt-3 text-[var(--text-secondary)]">{howItWorksSection.subtitle}</p>
        </div>

        <div className="how-it-works-grid mt-14 flex flex-col gap-6 lg:flex-row lg:items-stretch">
          {howItWorksSteps.map((step, index) => {
            const Preview = stepPreviews[step.icon];
            return (
              <div key={step.step} className="flex flex-1 items-stretch gap-4 lg:gap-6">
                <article className="group relative flex flex-1 flex-col overflow-hidden rounded-[24px] border border-border bg-[var(--bg-surface-secondary)] p-6 transition-shadow hover:shadow-[var(--shadow-md)]">
                  <BorderBeam
                    size={100}
                    duration={10}
                    colorFrom="#7BE13B"
                    colorTo="#0F6E68"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl">
                      <LottiePlayer
                        src={step.lottie}
                        playOnVisible
                        className="how-it-works-lottie"
                        style={{ width: lottieSizes.step, height: lottieSizes.step }}
                      />
                    </div>
                    <span className="font-mono text-3xl font-bold leading-none text-accent/25">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {step.body}
                  </p>

                  <Preview />

                  <div className="mt-5 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-teal" strokeWidth={2} aria-hidden />
                    <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-medium text-teal">
                      {step.time}
                    </span>
                  </div>
                </article>

                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden shrink-0 items-center lg:flex">
                    <ArrowRight className="h-5 w-5 text-[var(--text-muted)]" strokeWidth={2} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
