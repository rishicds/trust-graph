"use client";

import { useMemo } from "react";

const LEVELS = [
  "bg-[#EBEDF0]",
  "bg-[#C6E48B]/50",
  "bg-[#7BC96F]/45",
  "bg-[#239A3B]/35",
  "bg-[#196127]/30",
];

function HeatmapGrid({ seed, cols = 7, rows = 5, scale = 1 }: { seed: number; cols?: number; rows?: number; scale?: number }) {
  const cells = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < cols * rows; i++) {
      out.push((seed * 17 + i * 13) % LEVELS.length);
    }
    return out;
  }, [seed, cols, rows]);

  const cell = Math.round(10 * scale);

  return (
    <div
      className="inline-grid gap-[3px] rounded-md p-1"
      style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)` }}
    >
      {cells.map((level, i) => (
        <span
          key={i}
          className={`rounded-[2px] ${LEVELS[level]}`}
          style={{ width: cell, height: cell }}
        />
      ))}
    </div>
  );
}

const BLOBS = [
  { seed: 1, rot: "-8deg", scale: 1.1, className: "left-[6%] top-[20%]", delay: "" },
  { seed: 2, rot: "12deg", scale: 0.85, className: "right-[8%] top-[14%]", delay: "decor-float-delay-1" },
  { seed: 3, rot: "5deg", scale: 1.25, className: "left-[10%] bottom-[24%]", delay: "decor-float-delay-2" },
  { seed: 4, rot: "-14deg", scale: 0.9, className: "right-[12%] bottom-[30%]", delay: "decor-float-delay-3" },
  { seed: 5, rot: "3deg", scale: 1.05, className: "left-[42%] top-[10%] hidden md:block", delay: "decor-float-delay-1" },
];

export function ContributionBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--glow-teal),transparent_55%)]" />
      {BLOBS.map((blob) => (
        <div
          key={blob.seed}
          className={`decor-float absolute ${blob.className} ${blob.delay}`}
          style={{ ["--rot" as string]: blob.rot }}
        >
          <HeatmapGrid seed={blob.seed} scale={blob.scale} />
        </div>
      ))}
    </div>
  );
}
