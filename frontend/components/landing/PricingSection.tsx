"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { MagicCard } from "@/components/ui/magic-card";
import { landing, routes } from "@/constants";
import { layout, typography } from "@/constants/styles";

export function Pricing() {
  const { pricing } = landing;

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className={layout.containerMd}>
        <BlurFade>
          <div className="max-w-xl">
            <h2 className={typography.sectionTitleSm}>{pricing.title}</h2>
            <p className="mt-3 text-muted">{pricing.subtitle}</p>
          </div>
        </BlurFade>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {pricing.plans.map((plan, index) => (
            <BlurFade key={plan.name} delay={0.1 * index}>
              {plan.featured ? (
                <div className="relative rounded-[24px] p-[1px]">
                  <MagicCard className="rounded-[24px]">
                    <div className="relative overflow-hidden rounded-[23px] bg-teal p-8 text-white">
                      <BorderBeam
                        size={150}
                        duration={6}
                        colorFrom="#7BE13B"
                        colorTo="#ffffff"
                        borderWidth={2}
                      />
                      <p className="text-sm font-medium uppercase tracking-wide opacity-80">
                        {plan.name}
                      </p>
                      <p className="mt-3 text-4xl font-bold">{plan.price}</p>
                      <p className="mt-2 text-sm text-white/80">{plan.description}</p>
                      <ul className="mt-6 space-y-2.5 text-sm text-white/90">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <Check className="h-4 w-4 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link href={routes.signup} className="mt-8 inline-block">
                        <Button variant="primary">{pricing.cta}</Button>
                      </Link>
                    </div>
                  </MagicCard>
                </div>
              ) : (
                <div className="rounded-[24px] border border-border bg-white p-8">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted">
                    {plan.name}
                  </p>
                  <p className="mt-3 text-4xl font-bold">{plan.price}</p>
                  <p className="mt-2 text-sm text-muted">{plan.description}</p>
                  <ul className="mt-6 space-y-2.5 text-sm text-muted">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-teal" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button href={routes.signup} variant="secondary" className="mt-8">
                    {pricing.cta}
                  </Button>
                </div>
              )}
            </BlurFade>
          ))}
        </div>
        {pricing.footnote && (
          <BlurFade delay={0.2}>
            <p className="mt-8 text-center text-sm text-muted">{pricing.footnote}</p>
          </BlurFade>
        )}
      </div>
    </section>
  );
}
