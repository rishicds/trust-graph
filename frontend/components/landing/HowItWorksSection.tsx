"use client";

import { useRef } from "react";
import { Code, Link2, ShieldCheck } from "lucide-react";

import { AnimatedBeam } from "@/components/ui/animated-beam";
import { BlurFade } from "@/components/ui/blur-fade";
import { landing } from "@/constants";
import { layout, typography } from "@/constants/styles";

export function HowItWorks() {
  const { howItWorks } = landing;
  const containerRef = useRef<HTMLDivElement>(null);
  const githubRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  return (
    <section id="how-it-works" className={layout.sectionWhite}>
      <div className={`${layout.containerMd} grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start`}>
        <BlurFade>
          <div>
            <h2 className={typography.sectionTitleSm}>{howItWorks.title}</h2>
            <p className="mt-4 text-muted">{howItWorks.subtitle}</p>
          </div>
        </BlurFade>

        <div className="space-y-0">
          <div
            ref={containerRef}
            className="relative mb-10 hidden h-28 items-center justify-between rounded-[24px] border border-border bg-[#FAFAFA] px-8 md:flex"
          >
            <div
              ref={githubRef}
              className="z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white shadow-sm"
            >
              <Code className="h-6 w-6" />
            </div>
            <div
              ref={trustRef}
              className="z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal/20 bg-teal-light text-teal shadow-sm"
            >
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div
              ref={linkRef}
              className="z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white shadow-sm"
            >
              <Link2 className="h-6 w-6" />
            </div>
            <AnimatedBeam containerRef={containerRef} fromRef={githubRef} toRef={trustRef} curvature={-40} />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={trustRef}
              toRef={linkRef}
              curvature={-40}
              delay={2}
            />
          </div>

          <ol className="space-y-0 border-l border-border">
            {howItWorks.steps.map((step, index) => (
              <BlurFade key={step.step} delay={0.08 * index}>
                <li className="border-b border-border py-5 pl-6 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-xs text-teal">{step.step}</span>
                    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-xs text-[#2d5016]">
                      {step.time}
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted">{step.body}</p>
                </li>
              </BlurFade>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
