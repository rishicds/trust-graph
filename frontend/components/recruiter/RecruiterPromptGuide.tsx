"use client";

import { Lightbulb } from "lucide-react";

const EXAMPLE_PROMPT =
  "I need a senior developer proficient in TypeScript and Rust, has worked on Kubernetes and Terraform, lives in Berlin, and worked at DevRelSquad";

const PROMPT_TIPS = [
  { label: "Skills", example: "proficient in TypeScript, Rust" },
  { label: "Tools / stack", example: "worked on Kubernetes, Terraform, AWS" },
  { label: "Location", example: "lives in Berlin / based in Kolkata" },
  { label: "Employer", example: "worked at DevRelSquad / ex-DevRelSquad" },
];

export function RecruiterPromptGuide({
  onUseExample,
}: {
  onUseExample: (prompt: string) => void;
}) {
  return (
    <div className="rounded-xl border border-teal/20 bg-teal-light/40 p-4">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Ideal search prompt</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Combine role, skills, tools, location, and past employer in one sentence. TrustGraph parses
            each part and filters out profiles that don&apos;t match — e.g. only people who actually
            mention DevRelSquad when you ask for that employer.
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {PROMPT_TIPS.map((tip) => (
              <div key={tip.label} className="rounded-lg border border-border/60 bg-white/80 px-3 py-2">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-teal">{tip.label}</dt>
                <dd className="mt-0.5 text-xs text-muted">{tip.example}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => onUseExample(EXAMPLE_PROMPT)}
            className="mt-3 text-left text-xs font-medium text-teal hover:underline"
          >
            Use example prompt →
          </button>
        </div>
      </div>
    </div>
  );
}

export { EXAMPLE_PROMPT };
