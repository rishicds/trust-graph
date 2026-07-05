"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { landing, routes, sampleProfileHandle } from "@/constants";
import { layout, typography } from "@/constants/styles";

export function CTA() {
  const { cta } = landing;

  return (
    <section className="border-t border-border pb-24 pt-20 md:pb-32">
      <div className={`${layout.containerSm} text-center`}>
        <h2 className={typography.sectionTitleSm}>{cta.title}</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted">{cta.subtitle}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={routes.signUp}
            className="inline-flex items-center gap-2 rounded-full bg-[#111] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#333]"
          >
            {cta.primary}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Button href={routes.sampleProfile(sampleProfileHandle)} variant="ghost">
            {cta.secondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
