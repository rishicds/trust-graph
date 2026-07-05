"use client";

import { landing } from "@/constants";

const LOGOS = ["GitHub", "Vercel", "Stripe", "Linear", "Supabase"];

export function HeroSocialProof() {
  const { heroSocialProof } = landing;

  return (
    <section className="relative z-10 border-b border-border bg-white/80 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p className="text-sm font-medium text-[#6B7280]">{heroSocialProof.title}</p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {LOGOS.map((name) => (
            <li
              key={name}
              className="text-base font-semibold tracking-tight text-[#0A0A0A]/40 transition hover:text-[#0A0A0A]/70"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
