"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { featuredProfileHandles } from "@/constants/brand";
import { landing, routes } from "@/constants";
import { layout } from "@/constants/styles";
import { PublicProfile } from "@/lib/api";

type FeaturedProfilesProps = {
  profiles: PublicProfile[];
};

export function FeaturedProfiles({ profiles }: FeaturedProfilesProps) {
  const items =
    profiles.length > 0
      ? profiles
      : featuredProfileHandles.map((handle) => ({
          handle,
          display_name: handle,
          avatar_url: undefined,
          trust_score: {
            overall: 0,
            dimensions: {} as PublicProfile["trust_score"]["dimensions"],
            delta: 0,
            updated_at: "",
          },
          capabilities: [],
          evidence_count: 0,
          active_since: "",
          is_shadow: true,
          is_claimed: false,
          view_mode: "teaser",
        }));

  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className={layout.containerMd}>
        <BlurFade>
          <p className="section-label text-xs font-semibold uppercase tracking-widest text-teal">
            Shadow profiles
          </p>
          <h2 className="section-title mt-3 text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            {landing.featuredProfiles.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{landing.featuredProfiles.subtitle}</p>
        </BlurFade>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((profile, index) => (
            <BlurFade key={profile.handle} delay={0.08 * index}>
              <Link href={routes.sampleProfile(profile.handle)} className="group block">
                <div className="relative rounded-[20px] p-[1px]">
                  <MagicCard className="rounded-[20px]">
                    <div className="relative overflow-hidden rounded-[19px] bg-white p-5">
                      {index === 0 && <BorderBeam size={100} duration={7} />}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProfileAvatar
                            handle={profile.handle}
                            displayName={profile.display_name}
                            avatarUrl={profile.avatar_url}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium group-hover:text-teal">
                              {profile.display_name}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-muted">/{profile.handle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {profile.trust_score.overall > 0 ? (
                            <NumberTicker
                              value={profile.trust_score.overall}
                              className="text-2xl font-bold"
                            />
                          ) : (
                            <span className="font-mono text-2xl text-muted">—</span>
                          )}
                          <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
                        </div>
                      </div>
                      {profile.evidence_count > 0 && (
                        <p className="mt-3 text-xs text-muted">
                          {profile.evidence_count} evidence items
                        </p>
                      )}
                    </div>
                  </MagicCard>
                </div>
              </Link>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
