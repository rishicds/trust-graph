"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import {
  ConnectedBanner,
  InputRow,
  OnboardingStepCard,
  SourceTabButton,
} from "@/components/onboarding/OnboardingStepCard";
import { onboarding } from "@/constants";
import { states, surfaces, typography } from "@/constants/styles";
import { Profile } from "@/lib/api";

type StepGitHubProps = {
  profile: Profile | null;
  githubUsername: string;
  setGithubUsername: (v: string) => void;
  connecting: boolean;
  error: string;
  onConnect: () => void;
};

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function StackOverflowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 15.915l1.363-2.655 8.932 4.595-1.363 2.655-8.932-4.595zm1.477-3.633l1.363-2.655 10.295 5.313-1.363 2.655L7.588 12.282zM9.75 8.282l1.363-2.655 11.658 5.996-1.363 2.655L9.75 8.282z" />
    </svg>
  );
}

function DevpostIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M6 18V6h4.5c1.38 0 2.5 1.12 2.5 2.5S11.88 11 10.5 11H8v7H6zm2-9h2.5c.55 0 1-.45 1-1s-.45-1-1-1H8v2zm8 9V6h2v12h-2z" />
    </svg>
  );
}

function DevfolioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M4 4h8.5c3.59 0 6.5 2.91 6.5 6.5S16.09 17 12.5 17H9v3H4V4zm5 9h3.5a3.5 3.5 0 000-7H9v7zm11-1h5v2h-5v-2z" />
    </svg>
  );
}

function TalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 6v12M8 10h8M8 14h5" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  );
}

export function StepGitHub({
  profile,
  githubUsername,
  setGithubUsername,
  connecting,
  error,
  onConnect,
}: StepGitHubProps) {
  const hasGitHub = profile?.data_sources?.some((s) => s.platform === "github" && s.connected);

  if (hasGitHub) {
    const gh = profile?.data_sources?.find((s) => s.platform === "github");
    return (
      <OnboardingStepCard
        step={1}
        title={onboarding.github.connectedTitle}
        accent
        tourId="github-connected"
      >
        <ConnectedBanner>
          <p className="font-medium text-teal">
            {onboarding.github.connectedDescription}{" "}
            <span className="font-mono">@{gh?.external_id ?? githubUsername}</span>
          </p>
          {profile?.evidence_count ? (
            <p className="mt-1 text-muted">{profile.evidence_count} evidence items synced</p>
          ) : null}
        </ConnectedBanner>
      </OnboardingStepCard>
    );
  }

  return (
    <OnboardingStepCard
      step={1}
      title={onboarding.github.title.replace("Step 1 — ", "")}
      description={onboarding.github.description}
      tourId="github-connect"
    >
      <div className="flex items-center gap-3 rounded-[16px] border border-border bg-[#FAFAFA] p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111] text-white">
          <GitHubIcon className="h-5 w-5" />
        </div>
        <InputRow onSubmit={onConnect}>
          <input
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder={onboarding.github.placeholder}
            className={`flex-1 ${surfaces.inputInline} bg-white`}
          />
          <Button onClick={onConnect} disabled={connecting || !githubUsername.trim()} className="shrink-0">
            {connecting ? onboarding.github.connecting : onboarding.github.connect}
          </Button>
        </InputRow>
      </div>
      {error && <p className={`mt-3 ${states.error}`}>{error}</p>}
    </OnboardingStepCard>
  );
}

export type SourceTab = "linkedin" | "stackoverflow" | "devpost" | "devfolio" | "manual";

type StepSourcesProps = {
  activeTab: SourceTab;
  setActiveTab: (tab: SourceTab) => void;
  soUsername: string;
  setSoUsername: (v: string) => void;
  devpostUsername: string;
  setDevpostUsername: (v: string) => void;
  devfolioUrl: string;
  setDevfolioUrl: (v: string) => void;
  claimTitle: string;
  setClaimTitle: (v: string) => void;
  claimURL: string;
  setClaimURL: (v: string) => void;
  connecting: boolean;
  error: string;
  hasLinkedIn: boolean;
  hasSO: boolean;
  hasDevpost: boolean;
  hasDevfolio: boolean;
  linkedInHandle?: string;
  linkedinSlug: string;
  setLinkedinSlug: (v: string) => void;
  onConnectLinkedIn: () => void;
  onLinkedInOAuthError: (message: string) => void;
  onConnectSO: () => void;
  onConnectDevpost: () => void;
  onConnectDevfolio: () => void;
  onAddClaim: () => void;
};

const tabs: { id: SourceTab; label: string; hint: string; icon: typeof LinkedInIcon }[] = [
  { id: "linkedin", label: "LinkedIn", hint: "Verify professional identity", icon: LinkedInIcon },
  { id: "stackoverflow", label: "Stack Overflow", hint: "Accepted answers & reputation", icon: StackOverflowIcon },
  { id: "devpost", label: "Devpost", hint: "Hackathons & project wins", icon: DevpostIcon },
  { id: "devfolio", label: "Devfolio", hint: "Hackathons & portfolio", icon: DevfolioIcon },
  { id: "manual", label: "Talk or link", hint: "Talks, papers, job applications", icon: TalkIcon },
];

export function StepSources(props: StepSourcesProps) {
  const {
    activeTab,
    setActiveTab,
    soUsername,
    setSoUsername,
    devpostUsername,
    setDevpostUsername,
    devfolioUrl,
    setDevfolioUrl,
    claimTitle,
    setClaimTitle,
    claimURL,
    setClaimURL,
    connecting,
    error,
    hasLinkedIn,
    hasSO,
    hasDevpost,
    hasDevfolio,
    linkedInHandle,
    linkedinSlug,
    setLinkedinSlug,
    onConnectLinkedIn,
    onLinkedInOAuthError,
    onConnectSO,
    onConnectDevpost,
    onConnectDevfolio,
    onAddClaim,
  } = props;

  const { user } = useUser();

  async function startLinkedInOAuth() {
    if (!user) return;
    const redirectUrl = `${window.location.origin}/onboarding?linked=linkedin&step=2`;
    try {
      const res = await user.createExternalAccount({
        strategy: "oauth_linkedin_oidc",
        redirectUrl,
      });
      const url = res.verification?.externalVerificationRedirectURL;
      if (url) {
        window.location.href = url.toString();
      }
    } catch (err) {
      onLinkedInOAuthError(
        err instanceof Error ? err.message : "Could not start LinkedIn sign-in — try again or use Sync after linking in your account.",
      );
    }
  }

  function tabConnected(tab: SourceTab) {
    switch (tab) {
      case "linkedin":
        return hasLinkedIn;
      case "stackoverflow":
        return hasSO;
      case "devpost":
        return hasDevpost;
      case "devfolio":
        return hasDevfolio;
      default:
        return false;
    }
  }

  const connectedCount = [hasLinkedIn, hasSO, hasDevpost, hasDevfolio].filter(Boolean).length;
  const activeTabMeta = tabs.find((t) => t.id === activeTab);

  return (
    <OnboardingStepCard
      step={2}
      title={onboarding.sources.title.replace("Step 2 — ", "")}
      description={onboarding.sources.description}
    >
      {connectedCount > 0 && (
        <div className="mb-6 rounded-[14px] border border-teal/15 bg-teal-light/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            {onboarding.sources.connectedSummary}
          </p>
          <p className="mt-1 text-sm text-muted">
            {[
              hasLinkedIn && (linkedInHandle ? `LinkedIn @${linkedInHandle}` : "LinkedIn"),
              hasSO && "Stack Overflow",
              hasDevpost && "Devpost",
              hasDevfolio && "Devfolio",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}

      <div
        data-tour="source-tabs"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        role="tablist"
        aria-label="Evidence sources"
      >
        {tabs.map((tab) => (
          <SourceTabButton
            key={tab.id}
            active={activeTab === tab.id}
            connected={tabConnected(tab.id)}
            onClick={() => setActiveTab(tab.id)}
            icon={<tab.icon className="h-5 w-5" />}
            label={tab.label}
            hint={tab.hint}
          />
        ))}
      </div>

      <div
        data-tour="source-form"
        className="mt-6 rounded-[18px] border border-border bg-white p-5 shadow-sm sm:p-6"
        role="tabpanel"
        aria-labelledby={`source-tab-${activeTab}`}
      >
        {activeTabMeta && (
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
            {activeTabMeta.label}
            {tabConnected(activeTab) ? " · connected" : ""}
          </p>
        )}
        {activeTab === "linkedin" && (
          <>
            {hasLinkedIn ? (
              <ConnectedBanner>
                <p className="font-medium text-teal">{onboarding.sources.linkedinConnected}</p>
                {linkedInHandle && (
                  <p className="mt-1 text-muted">
                    {onboarding.linkedin.connectedDescription}{" "}
                    <span className="font-mono font-medium text-teal">@{linkedInHandle}</span>
                  </p>
                )}
              </ConnectedBanner>
            ) : (
              <>
                <p className={typography.body}>{onboarding.linkedin.description}</p>
                <p className="mt-2 text-xs text-muted">{onboarding.linkedin.oauthHint}</p>
                <div className="mt-4">
                  <InputRow onSubmit={onConnectLinkedIn}>
                    <input
                      value={linkedinSlug}
                      onChange={(e) => setLinkedinSlug(e.target.value)}
                      placeholder={onboarding.linkedin.slugPlaceholder}
                      className={`flex-1 ${surfaces.inputInline} bg-white`}
                      aria-label="LinkedIn profile slug"
                    />
                    <Button variant="secondary" onClick={onConnectLinkedIn} disabled={connecting} className="shrink-0">
                      {connecting ? onboarding.linkedin.syncing : onboarding.linkedin.sync}
                    </Button>
                  </InputRow>
                  <p className="mt-2 text-xs text-muted">{onboarding.linkedin.slugHint}</p>
                </div>
                <div className="mt-4">
                  <Button onClick={() => void startLinkedInOAuth()} disabled={connecting || !user}>
                    <LinkedInIcon className="mr-2 h-4 w-4" />
                    {connecting ? onboarding.linkedin.connecting : onboarding.linkedin.connect}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "stackoverflow" && (
          <>
            {hasSO ? (
              <ConnectedBanner>
                <p className="font-medium text-teal">{onboarding.sources.soConnected}</p>
              </ConnectedBanner>
            ) : (
              <>
                <p className={typography.body}>{onboarding.stackoverflow.description}</p>
                <div className="mt-4">
                  <InputRow onSubmit={onConnectSO}>
                    <input
                      value={soUsername}
                      onChange={(e) => setSoUsername(e.target.value)}
                      placeholder={onboarding.stackoverflow.placeholder}
                      className={`flex-1 ${surfaces.inputInline} bg-white`}
                    />
                    <Button onClick={onConnectSO} disabled={connecting || !soUsername.trim()} className="shrink-0">
                      {connecting ? onboarding.stackoverflow.connecting : onboarding.stackoverflow.connect}
                    </Button>
                  </InputRow>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "devpost" && (
          <>
            {hasDevpost ? (
              <ConnectedBanner>
                <p className="font-medium text-teal">{onboarding.sources.devpostConnected}</p>
              </ConnectedBanner>
            ) : (
              <>
                <p className={typography.body}>{onboarding.devpost.description}</p>
                <div className="mt-4">
                  <InputRow onSubmit={onConnectDevpost}>
                    <input
                      value={devpostUsername}
                      onChange={(e) => setDevpostUsername(e.target.value)}
                      placeholder={onboarding.devpost.placeholder}
                      className={`flex-1 ${surfaces.inputInline} bg-white`}
                    />
                    <Button
                      onClick={onConnectDevpost}
                      disabled={connecting || !devpostUsername.trim()}
                      className="shrink-0"
                    >
                      {connecting ? onboarding.devpost.connecting : onboarding.devpost.connect}
                    </Button>
                  </InputRow>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "devfolio" && (
          <>
            {hasDevfolio ? (
              <ConnectedBanner>
                <p className="font-medium text-teal">{onboarding.sources.devfolioConnected}</p>
              </ConnectedBanner>
            ) : (
              <>
                <p className={typography.body}>{onboarding.devfolio.description}</p>
                <div className="mt-4">
                  <InputRow onSubmit={onConnectDevfolio}>
                    <input
                      value={devfolioUrl}
                      onChange={(e) => setDevfolioUrl(e.target.value)}
                      placeholder={onboarding.devfolio.placeholder}
                      className={`flex-1 ${surfaces.inputInline} bg-white`}
                    />
                    <Button
                      onClick={onConnectDevfolio}
                      disabled={connecting || !devfolioUrl.trim()}
                      className="shrink-0"
                    >
                      {connecting ? onboarding.devfolio.connecting : onboarding.devfolio.connect}
                    </Button>
                  </InputRow>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "manual" && (
          <>
            <h3 className="text-base font-semibold text-[#111111]">{onboarding.manualClaim.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {onboarding.manualClaim.description}
            </p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onAddClaim();
              }}
            >
              <div>
                <label htmlFor="claim-title" className="text-sm font-medium text-[#111111]">
                  {onboarding.manualClaim.titleLabel}
                </label>
                <input
                  id="claim-title"
                  value={claimTitle}
                  onChange={(e) => setClaimTitle(e.target.value)}
                  placeholder={onboarding.manualClaim.titlePlaceholder}
                  className={`mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20`}
                />
                <p className="mt-1.5 text-xs text-muted">{onboarding.manualClaim.titleHint}</p>
              </div>
              <div>
                <label htmlFor="claim-url" className="text-sm font-medium text-[#111111]">
                  {onboarding.manualClaim.urlLabel}
                </label>
                <input
                  id="claim-url"
                  value={claimURL}
                  onChange={(e) => setClaimURL(e.target.value)}
                  placeholder={onboarding.manualClaim.urlPlaceholder}
                  className={`mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20`}
                />
                <p className="mt-1.5 text-xs text-muted">{onboarding.manualClaim.urlHint}</p>
              </div>
              <Button
                type="submit"
                className="min-h-11 px-6"
                disabled={connecting || !claimTitle.trim()}
              >
                {connecting ? onboarding.manualClaim.submitting : onboarding.manualClaim.submit}
              </Button>
            </form>
          </>
        )}
      </div>

      {error && <p className={`mt-4 ${states.error}`}>{error}</p>}
    </OnboardingStepCard>
  );
}
