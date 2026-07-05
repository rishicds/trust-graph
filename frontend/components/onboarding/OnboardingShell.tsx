"use client";

import { ReactNode } from "react";

export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F5F5]">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] glow-green" aria-hidden />
      <div
        className="pointer-events-none absolute -right-32 top-40 h-64 w-64 rounded-full bg-teal-light/40 blur-3xl"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}
