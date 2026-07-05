"use client";

import { Layers } from "lucide-react";

import { landing } from "@/constants";
import { layout, typography } from "@/constants/styles";

export function Value() {
  const { fourLayers } = landing;

  return (
    <section id="layers" className={layout.section}>
      <div className={layout.container}>
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-teal">
            <Layers className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-wide">Product architecture</p>
          </div>
          <h2 className={`mt-3 ${typography.sectionTitleSm}`}>{fourLayers.title}</h2>
          <p className={`mt-4 ${typography.bodyLg}`}>{fourLayers.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {fourLayers.layers.map((layer) => (
            <article
              key={layer.title}
              className="rounded-[20px] border border-border bg-white p-8"
            >
              <p className="font-mono text-xs text-teal">{layer.index}</p>
              <h3 className="mt-3 text-lg font-semibold">{layer.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{layer.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
