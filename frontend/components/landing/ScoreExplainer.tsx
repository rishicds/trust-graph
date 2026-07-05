"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import { LottiePlayer } from "@/components/lottie/LottiePlayer";
import { NumberTicker } from "@/components/ui/number-ticker";
import { lottieAssets, lottieSizes } from "@/constants/lottie";
import { scoreComparison, scoreExplainerSection, scoreSignals } from "@/lib/data";
import { gsap } from "@/lib/gsap";

export function ScoreExplainer() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".signal-row", {
        scrollTrigger: { trigger: ".score-card", start: "top 70%" },
        x: -20,
        opacity: 0,
        stagger: 0.08,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
          {scoreExplainerSection.label}
        </p>
        <h2 className="section-title mt-3 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          {scoreExplainerSection.title}
        </h2>
        <p className="mt-3 text-[var(--text-secondary)]">{scoreExplainerSection.subtitle}</p>

        <div className="mt-14 grid items-start gap-16 lg:grid-cols-2">
          <div className="score-card rounded-[24px] border border-border bg-[var(--bg-surface-secondary)] p-7">
            <div className="flex items-center gap-3">
              <LottiePlayer
                src={lottieAssets.trustScoreReveal}
                playOnVisible
                className="score-lottie"
                style={{ width: lottieSizes.card, height: lottieSizes.card }}
              />
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Score breakdown · @rishicds
              </p>
            </div>
            <p className="mt-4 text-sm text-[var(--text-muted)]">Trust Score</p>
            <NumberTicker value={82} className="text-5xl font-bold text-[var(--text-primary)]" />

            <div className="mt-6">
              {scoreSignals.map((signal) => (
                <div
                  key={signal.text}
                  className="signal-row flex items-center justify-between border-b border-[var(--border-soft)] py-2.5 text-sm"
                >
                  <span className="text-[var(--text-secondary)]">
                    <span className={signal.positive ? "text-accent" : "text-red-400"}>
                      {signal.positive ? "[+]" : "[−]"}
                    </span>{" "}
                    {signal.text}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      signal.positive ? "text-teal" : "text-red-400"
                    }`}
                  >
                    {signal.points > 0 ? "+" : ""}
                    {signal.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">
              {scoreExplainerSection.rightTitle}
            </h3>
            <p className="mt-4 leading-[1.7] text-[var(--text-secondary)]">
              {scoreExplainerSection.rightBody}
            </p>

            <div className="mt-8 overflow-hidden rounded-[16px] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-surface-secondary)] text-xs font-medium text-[var(--text-muted)]">
                    {scoreComparison.headers.map((h) => (
                      <th key={h} className="px-4 py-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scoreComparison.rows.map((row) => (
                    <tr
                      key={row.name}
                      className={row.highlight ? "bg-accent-soft" : undefined}
                    >
                      <td
                        className={`border-b border-[var(--border-soft)] px-4 py-3 ${
                          row.highlight ? "font-semibold text-teal" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {row.name}
                      </td>
                      {row.values.map((val, i) => (
                        <td
                          key={i}
                          className={`border-b border-[var(--border-soft)] px-4 py-3 ${
                            val === "✓"
                              ? "font-medium text-teal"
                              : val === "✗"
                                ? "text-red-400"
                                : "text-[var(--text-muted)]"
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
