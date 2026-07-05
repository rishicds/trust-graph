"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { EvidenceList } from "@/components/profile/EvidenceList";
import { ProUpsellBanner } from "@/components/profile/ProUpsellBanner";
import {
  BentoBlock,
  BentoCapabilities,
  BentoInsightsList,
  BentoTeaserCta,
  BentoTimeline,
  ProfileBentoGrid,
  ProfileBentoHero,
} from "@/components/profile/ProfileBento";
import { ProfileAIInsights } from "@/components/profile/ProfileAIInsights";
import { ProfileRecruiterReport } from "@/components/profile/ProfileRecruiterReport";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import { ProfileDisputePanel } from "@/components/profile/ProfileDisputePanel";
import { RecruiterModePanel } from "@/components/profile/RecruiterModePanel";
import { profile as profileCopy, routes } from "@/constants";
import { layout, links } from "@/constants/styles";
import { api, PublicProfile } from "@/lib/api";

type ProfilePageContentProps = {
  handle: string;
  initialProfile: PublicProfile;
};

export function ProfilePageContent({ handle, initialProfile }: ProfilePageContentProps) {
  const { isSignedIn, getToken } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [loadingAuth, setLoadingAuth] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setProfile(initialProfile);
      return;
    }

    let cancelled = false;

    async function loadAuthenticatedProfile() {
      setLoadingAuth(true);
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        try {
          await api.syncClerk(token);
        } catch {
          // still attempt profile fetch with valid Clerk JWT
        }

        const next = await api.getProfile(handle, token);
        if (!cancelled) setProfile(next);
      } catch {
        // keep initial teaser data on failure
      } finally {
        if (!cancelled) setLoadingAuth(false);
      }
    }

    void loadAuthenticatedProfile();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken, handle]);

  const isAuthenticatedView = profile.view_mode === "summary" || profile.view_mode === "full";
  const isFullView = profile.view_mode === "full";
  const isShadowUnclaimed = profile.is_shadow && !profile.is_claimed;
  const evidence = profile.evidence ?? [];
  const stats = profile.stats ?? [];
  const socialLinks = profile.social_links ?? [];
  const hasDimensions = Boolean(
    profile.trust_score.dimensions &&
      (profile.trust_score.dimensions.evidence_depth > 0 ||
        profile.trust_score.dimensions.consistency > 0),
  );

  return (
    <main className={`${layout.page} relative pt-24 pb-10`}>
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

      <div className="relative mx-auto max-w-6xl px-4 md:px-5">
        <ProfileBentoGrid>
          <ProfileBentoHero
            handle={profile.handle}
            displayName={profile.display_name}
            headline={profile.headline}
            avatarUrl={profile.avatar_url}
            trustScore={profile.trust_score}
            evidenceCount={profile.evidence_count}
            topCapability={profile.capabilities[0]?.name}
            summary={profile.ai_insight?.summary}
            roleSignals={profile.ai_insight?.role_signals}
            socialLinks={socialLinks}
            githubPublicEmail={profile.github_public_email}
            isShadowUnclaimed={isShadowUnclaimed}
            isAuthenticatedView={isAuthenticatedView}
            isOwner={Boolean(profile.is_owner)}
            loadingAuth={loadingAuth}
            showScoreBreakdown={hasDimensions || isAuthenticatedView}
          />

          {stats.length > 0 && (
            <BentoBlock className="col-span-12">
              <ProfileStatsGrid stats={stats} embedded />
            </BentoBlock>
          )}

          {profile.ai_insight && (
            <BentoBlock className="col-span-12 md:col-span-7">
              <ProfileAIInsights insight={profile.ai_insight} embedded highlightsOnly />
            </BentoBlock>
          )}

          <BentoCapabilities
            capabilities={profile.capabilities}
            roleSignals={profile.ai_insight?.role_signals}
          />

          {isAuthenticatedView && !profile.is_owner && (
            <BentoBlock className="col-span-12">
              <RecruiterModePanel
                handle={handle}
                profile={profile}
                onProfileUpdate={setProfile}
                embedded
              />
            </BentoBlock>
          )}

          {isAuthenticatedView && profile.is_owner && profile.recruiter_report && (
            <BentoBlock className="col-span-12">
              <ProfileRecruiterReport report={profile.recruiter_report} embedded />
            </BentoBlock>
          )}

          {isAuthenticatedView && !profile.is_owner && (
            <BentoBlock className="col-span-12">
              <EvidenceList evidence={evidence} embedded />
            </BentoBlock>
          )}

          {!isAuthenticatedView && <BentoTeaserCta />}

          {isAuthenticatedView && profile.timeline && profile.timeline.length > 0 && (
            <BentoTimeline events={profile.timeline} />
          )}

          {isFullView && profile.insights && profile.insights.length > 0 && (
            <BentoInsightsList items={profile.insights} />
          )}

          {isAuthenticatedView && !isFullView && !profile.is_owner && (
            <BentoBlock className="col-span-12 bg-[#FAFAFA]">
              <p className="text-sm text-muted">{profileCopy.authenticated.comparativeInsights}</p>
            </BentoBlock>
          )}

          {isFullView && profile.is_owner && !profile.is_pro && (
            <BentoBlock className="col-span-12">
              <ProUpsellBanner embedded />
            </BentoBlock>
          )}

          <ProfileDisputePanel
            handle={profile.handle}
            isClaimed={profile.is_claimed}
            isOwner={Boolean(profile.is_owner)}
          />
        </ProfileBentoGrid>

        {!isAuthenticatedView && (
          <p className="mt-4 text-center text-xs text-muted">
            {profileCopy.footer.prompt}{" "}
            <Link href={routes.signup} className={links.inlineUnderline}>
              {profileCopy.footer.cta}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
