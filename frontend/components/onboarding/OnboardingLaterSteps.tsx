"use client";

import { TrustScoreDisplay } from "@/components/profile/TrustScoreDisplay";
import { Button } from "@/components/ui/Button";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { onboarding, routes, scoreDimensionMeta } from "@/constants";
import { surfaces, typography } from "@/constants/styles";
import { badgeMarkdown } from "@/lib/badge";
import { api, Profile } from "@/lib/api";

const dimensions = scoreDimensionMeta.map((dim) => ({
  label: dim.label,
  hint: dim.summary,
  description: dim.description,
}));

export function StepScoreReveal({ profile }: { profile: Profile }) {
  return (
    <OnboardingStepCard
      step={3}
      title={onboarding.score.title.replace("Step 3 — ", "")}
      description={onboarding.score.description}
    >
      {profile.trust_score ? (
        <>
          <div
            data-tour="score-display"
            className="rounded-[20px] border border-teal/15 bg-gradient-to-br from-teal-light/30 via-white to-accent-soft/30 p-6 sm:p-8"
          >
            <TrustScoreDisplay score={profile.trust_score} />
          </div>
          <div
            data-tour="score-dimensions"
            className="mt-6 grid gap-3 sm:grid-cols-2"
          >
            {dimensions.map((dim) => (
              <div
                key={dim.label}
                className="rounded-[16px] border border-border bg-[#FAFAFA] p-4"
              >
                <p className="text-sm font-medium">{dim.label}</p>
                <p className="mt-1 text-xs text-muted">{dim.hint}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{dim.description}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4 py-8 text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-[3px] border-border border-t-teal" />
          <p className="text-sm text-muted">Calculating your score from connected evidence…</p>
        </div>
      )}
    </OnboardingStepCard>
  );
}

export function StepPassport({
  profile,
  passportUrl,
  copied,
  badgeCopied,
  onCopyPassport,
  onCopyBadge,
}: {
  profile: Profile;
  passportUrl: string;
  copied: boolean;
  badgeCopied: boolean;
  onCopyPassport: () => void;
  onCopyBadge: () => void;
}) {
  return (
    <OnboardingStepCard
      step={4}
      title={onboarding.passport.title.replace("Step 4 — ", "")}
      description={onboarding.passport.description}
    >
      <div data-tour="passport-link" className="rounded-[18px] border border-border bg-[#FAFAFA] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your link</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className={`flex-1 ${surfaces.codeBlock} bg-white`}>{passportUrl}</code>
          <Button variant="secondary" onClick={onCopyPassport} className="shrink-0">
            {copied ? onboarding.passport.copied : onboarding.passport.copy}
          </Button>
        </div>
      </div>

      <div data-tour="passport-badge" className="mt-6 rounded-[18px] border border-border bg-[#FAFAFA] p-5">
        <h3 className="font-semibold">{onboarding.badge.title}</h3>
        <p className={`mt-1 ${typography.body}`}>{onboarding.badge.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <img src={api.badgeUrl(profile.handle)} alt="TrustGraph badge" className="h-7" />
          <Button variant="secondary" onClick={onCopyBadge}>
            {badgeCopied ? onboarding.badge.copied : onboarding.badge.copy}
          </Button>
        </div>
        <code className={`mt-4 block ${surfaces.codeBlockSm}`}>{badgeMarkdown(profile.handle)}</code>
      </div>

      <Button href={routes.passport} variant="ghost" className="mt-6">
        {onboarding.passport.preview}
      </Button>
    </OnboardingStepCard>
  );
}

export function StepPeerVerify({
  peerEmail,
  setPeerEmail,
  peerSkill,
  setPeerSkill,
  peerContext,
  setPeerContext,
  connecting,
  error,
  confirmUrl,
  onSend,
}: {
  peerEmail: string;
  setPeerEmail: (v: string) => void;
  peerSkill: string;
  setPeerSkill: (v: string) => void;
  peerContext: string;
  setPeerContext: (v: string) => void;
  connecting: boolean;
  error: string;
  confirmUrl: string;
  onSend: () => void;
}) {
  return (
    <OnboardingStepCard
      step={5}
      title={onboarding.peer.title.replace("Step 5 — ", "")}
      description={onboarding.peer.description}
    >
      <div data-tour="peer-form" className="space-y-3 rounded-[18px] border border-border bg-[#FAFAFA] p-5">
        <input
          value={peerEmail}
          onChange={(e) => setPeerEmail(e.target.value)}
          placeholder={onboarding.peer.emailPlaceholder}
          className={`w-full ${surfaces.inputInline} bg-white`}
        />
        <input
          value={peerSkill}
          onChange={(e) => setPeerSkill(e.target.value)}
          placeholder={onboarding.peer.skillPlaceholder}
          className={`w-full ${surfaces.inputInline} bg-white`}
        />
        <input
          value={peerContext}
          onChange={(e) => setPeerContext(e.target.value)}
          placeholder={onboarding.peer.contextPlaceholder}
          className={`w-full ${surfaces.inputInline} bg-white`}
        />
        <Button
          onClick={onSend}
          disabled={connecting || !peerEmail.trim() || !peerSkill.trim()}
          className="w-full sm:w-auto"
        >
          {connecting ? onboarding.peer.sending : onboarding.peer.send}
        </Button>
      </div>
      {confirmUrl && (
        <p className="mt-4 text-sm text-teal">
          {onboarding.peer.sent}:{" "}
          <code className={surfaces.codeBlockSm}>{confirmUrl}</code>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </OnboardingStepCard>
  );
}
