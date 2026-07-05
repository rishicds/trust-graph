"use client";

import { landing } from "@/constants";
import { layout, typography } from "@/constants/styles";

export function ProblemSpace() {
  const { problems } = landing;

  return (
    <section className={`${layout.section} border-t border-border bg-[#FAFAFA]`}>
      <div className={layout.containerMd}>
        <div className="max-w-2xl">
          <h2 className={typography.sectionTitleSm}>{problems.title}</h2>
          <p className={`mt-4 ${typography.body}`}>{problems.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.personas.map((persona) => (
            <article
              key={persona.title}
              className="rounded-[20px] border border-border bg-white p-6 transition hover:border-teal/30"
            >
              <h3 className="font-semibold">{persona.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{persona.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
