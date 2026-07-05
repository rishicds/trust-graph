"use client";

import type { MotionProps } from "motion/react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileClaimPanel } from "@/components/profile/ProfileClaimPanel";
import { ProfileSocialLinks } from "@/components/profile/ProfileSocialLinks";
import { ScoreDimensionBar } from "@/components/profile/ScoreDimensionsExplainer";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Card";
import { brand, profile as profileCopy, routes, scoreDimensionMeta } from "@/constants";
import type { SocialLink } from "@/components/profile/ProfileSocialLinks";
import type { TrustScore } from "@/lib/api";
import { cn } from "@/lib/utils";

type BentoBlockProps = {
  className?: string;
  children: React.ReactNode;
} & MotionProps;

export function BentoBlock({ className, children, ...rest }: BentoBlockProps) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={twMerge(
        "col-span-12 border border-border bg-white p-3 md:p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function ProfileBentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      transition={{ staggerChildren: 0.03 }}
      className="grid grid-flow-dense grid-cols-12 gap-2 md:gap-px md:border md:border-border md:bg-border"
    >
      {children}
    </motion.div>
  );
}

const dimensionConfig = scoreDimensionMeta.map((dim) => ({
  label: dim.label,
  key: dim.key,
  summary: dim.summary,
}));

function ScoreRail({
  trustScore,
  evidenceCount,
  topCapability,
  roleSignals,
  showDimensions,
}: {
  trustScore: TrustScore;
  evidenceCount: number;
  topCapability?: string;
  roleSignals?: string[];
  showDimensions: boolean;
}) {
  const topRoles = roleSignals?.slice(0, 5) ?? [];

  return (
    <div className="flex h-full flex-col border-t border-border pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {profileCopy.score.label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-4xl font-bold leading-none tracking-tight md:text-5xl">
          {trustScore.overall.toFixed(0)}
        </span>
        <span className="font-mono text-xs text-muted">{profileCopy.score.max}</span>
        {trustScore.delta !== 0 && (
          <span className="font-mono text-xs text-teal">
            {trustScore.delta > 0 ? "+" : ""}
            {trustScore.delta.toFixed(1)}
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-2 text-[11px]">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted">{profileCopy.stats.evidence}</dt>
          <dd className="font-mono font-semibold">{evidenceCount}</dd>
        </div>

        {topRoles.length > 0 ? (
          <div className="border-t border-border pt-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              {profileCopy.stats.topFiveCapabilities}
            </dt>
            <dd className="mt-1.5 space-y-1.5">
              {topRoles.map((role) => (
                <p key={role} className="text-[10px] leading-snug text-[#111111]">
                  {role}
                </p>
              ))}
            </dd>
          </div>
        ) : topCapability ? (
          <div className="flex items-baseline justify-between gap-2 border-t border-border pt-2">
            <dt className="text-muted">{profileCopy.stats.topCapability}</dt>
            <dd className="truncate font-medium">{topCapability}</dd>
          </div>
        ) : null}
      </dl>

      {showDimensions && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Score breakdown
          </p>
          {dimensionConfig.map(({ label, key, summary }) => {
            const value =
              trustScore.dimensions[key] ??
              (key === "impact_signals" ? trustScore.dimensions.trust_ratio : 0) ??
              0;
            return (
              <ScoreDimensionBar
                key={key}
                label={label}
                value={value}
                summary={topRoles.length > 0 ? undefined : summary}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

type ProfileBentoHeroProps = {
  handle: string;
  displayName: string;
  headline?: string;
  avatarUrl?: string;
  trustScore: TrustScore;
  evidenceCount: number;
  topCapability?: string;
  summary?: string;
  roleSignals?: string[];
  socialLinks: SocialLink[];
  githubPublicEmail?: string;
  isShadowUnclaimed: boolean;
  isAuthenticatedView: boolean;
  isOwner: boolean;
  loadingAuth: boolean;
  showScoreBreakdown: boolean;
};

export function ProfileBentoHero({
  handle,
  displayName,
  headline,
  avatarUrl,
  trustScore,
  evidenceCount,
  topCapability,
  summary,
  roleSignals,
  socialLinks,
  githubPublicEmail,
  isShadowUnclaimed,
  isAuthenticatedView,
  isOwner,
  loadingAuth,
  showScoreBreakdown,
}: ProfileBentoHeroProps) {
  return (
    <BentoBlock className="col-span-12">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">
            Trust Passport
          </span>
          <span className="text-border">·</span>
          {isShadowUnclaimed ? (
            <Pill>{profileCopy.badges.shadow}</Pill>
          ) : (
            <Pill verified>{profileCopy.badges.verified}</Pill>
          )}
          {!isAuthenticatedView && (
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {profileCopy.teaser.publicPreview}
            </span>
          )}
          {loadingAuth && (
            <span className="text-[10px] text-muted">Loading your view…</span>
          )}
        </div>
        <p className="font-mono text-[10px] text-muted">{brand.passportUrl(handle)}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-12 md:gap-4">
        <div className="flex flex-col gap-3 md:col-span-8">
          <div className="flex gap-3">
            <ProfileAvatar
              handle={handle}
              displayName={displayName}
              avatarUrl={avatarUrl}
              size="lg"
              className="self-start rounded-md shadow-none"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
                {displayName}
              </h1>
              <p className="mt-1 text-sm leading-snug text-muted">
                {headline ||
                  "Verified evidence across public work — one portable reputation link."}
              </p>
              <ProfileSocialLinks
                links={socialLinks}
                githubEmail={githubPublicEmail}
                prominent
                className="mt-3"
              />
            </div>
          </div>

          {summary && (
            <p className="border-t border-border pt-3 text-sm leading-relaxed text-[#111111]">
              {summary}
            </p>
          )}
        </div>

        <div className="md:col-span-4">
          <ScoreRail
            trustScore={trustScore}
            evidenceCount={evidenceCount}
            topCapability={topCapability}
            roleSignals={roleSignals}
            showDimensions={showScoreBreakdown}
          />
        </div>
      </div>

      {isShadowUnclaimed && !isOwner ? (
        <div className="mt-3 border-t border-border pt-3">
          <ProfileClaimPanel handle={handle} />
        </div>
      ) : (
        ( !isAuthenticatedView || (isAuthenticatedView && !isOwner)) && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {!isAuthenticatedView && (
              <Button href={routes.signIn} variant="secondary" className="px-3 py-1.5 text-xs">
                {profileCopy.teaser.signInCta}
              </Button>
            )}
            {isAuthenticatedView && !isOwner && (
              <Button href={routes.dashboard} variant="ghost" className="px-3 py-1.5 text-xs">
                {profileCopy.authenticated.viewYourProfile}
              </Button>
            )}
          </div>
        )
      )}
    </BentoBlock>
  );
}

export function BentoSectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-1.5">
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[11px] leading-snug text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function BentoCapabilities({
  capabilities,
  roleSignals,
}: {
  capabilities: Array<{ name: string; evidence_count: number }>;
  roleSignals?: string[];
}) {
  const topRoles = roleSignals?.slice(0, 5) ?? [];

  if (topRoles.length > 0) {
    return (
      <BentoBlock className="col-span-12 md:col-span-5">
        <BentoSectionHeader title={profileCopy.capabilities.topFiveTitle} />
        <ul className="space-y-1.5">
          {topRoles.map((role) => (
            <li
              key={role}
              className="border border-border bg-[#FAFAFA] px-3 py-2 text-xs leading-snug text-[#111111]"
            >
              {role}
            </li>
          ))}
        </ul>
      </BentoBlock>
    );
  }

  if (capabilities.length === 0) return null;

  return (
    <BentoBlock className="col-span-12 md:col-span-5">
      <BentoSectionHeader title={profileCopy.capabilities.title} />
      <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((cap) => (
          <li
            key={cap.name}
            className="flex items-center justify-between bg-white px-2 py-1.5 text-sm"
          >
            <span className="font-medium">{cap.name}</span>
            <span className="font-mono text-xs text-muted">{cap.evidence_count}</span>
          </li>
        ))}
      </ul>
    </BentoBlock>
  );
}

export function BentoTeaserCta() {
  return (
    <BentoBlock className="col-span-12 bg-accent-soft/30">
      <p className="text-sm leading-snug">
        <span className="font-semibold text-[#111111]">Unlock the full passport.</span>{" "}
        <span className="text-muted">
          Sign in for evidence timeline, score breakdown, and recruiter insights.
        </span>
      </p>
      <a
        href={routes.signIn}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal hover:underline"
      >
        {profileCopy.teaser.signInLink} <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </BentoBlock>
  );
}

export function BentoTimeline({
  events,
}: {
  events: Array<{ id?: string; label: string; platform: string; occurred_at: string }>;
}) {
  return (
    <BentoBlock className="col-span-12">
      <BentoSectionHeader title={profileCopy.timeline.title} />
      <ol className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event, i) => (
          <li
            key={event.id ?? i}
            className="border-b border-r border-border px-2 py-2 text-[11px] last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0"
          >
            <p className="font-medium leading-snug">{event.label}</p>
            <p className="mt-0.5 text-muted capitalize">
              {event.platform} · {new Date(event.occurred_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ol>
    </BentoBlock>
  );
}

export function BentoInsightsList({ items }: { items: Array<{ dimension: string; message: string }> }) {
  return (
    <BentoBlock className="col-span-12">
      <BentoSectionHeader title={profileCopy.insights.title} />
      <ul className="divide-y divide-border text-xs leading-snug text-muted">
        {items.map((item) => (
          <li key={item.dimension} className="flex gap-2 py-1.5">
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-teal" />
            <span>{item.message}</span>
          </li>
        ))}
      </ul>
    </BentoBlock>
  );
}
