"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { StepPassport, StepPeerVerify, StepScoreReveal } from "@/components/onboarding/OnboardingLaterSteps";
import { OnboardingLoading } from "@/components/onboarding/OnboardingLoading";
import { OnboardingNavFooter } from "@/components/onboarding/OnboardingNavFooter";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { AccountTypeStep, SegmentPicker } from "@/components/onboarding/AccountTypeStep";
import { StepGitHub, StepSources, type SourceTab } from "@/components/onboarding/OnboardingSteps";
import { OnboardingTour, TourGuideButton } from "@/components/onboarding/OnboardingTour";
import { Button } from "@/components/ui/Button";
import { brand, errors, onboarding, routes } from "@/constants";
import type { WizardStep } from "@/constants/onboardingTour";
import { WIZARD_STEP_COUNT } from "@/constants/onboardingTour";
import { layout, states, surfaces, typography } from "@/constants/styles";
import { api, Profile, User } from "@/lib/api";
import { badgeMarkdown } from "@/lib/badge";
import { syncAccount } from "@/lib/sync-account";

function deriveInitialStep(profile: Profile | null, hasGitHub: boolean): WizardStep {
  const backend = profile?.onboarding_step ?? 1;
  if (!hasGitHub) return 1;
  if (backend >= 5) return 5;
  if (backend >= 4) return 4;
  if (backend >= 3) return 3;
  if (backend >= 2) return 2;
  return 2;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [preStep, setPreStep] = useState<"account" | "segment" | "wizard">("account");
  const [githubUsername, setGithubUsername] = useState("");
  const [soUsername, setSoUsername] = useState("");
  const [devpostUsername, setDevpostUsername] = useState("");
  const [devfolioUrl, setDevfolioUrl] = useState("");
  const [claimTitle, setClaimTitle] = useState("");
  const [claimURL, setClaimURL] = useState("");
  const [shadowHandle, setShadowHandle] = useState("");
  const [bootstrapMessage, setBootstrapMessage] = useState("");
  const [peerEmail, setPeerEmail] = useState("");
  const [peerSkill, setPeerSkill] = useState("");
  const [peerContext, setPeerContext] = useState("");
  const [confirmUrl, setConfirmUrl] = useState("");
  const [sourceTab, setSourceTab] = useState<SourceTab>("linkedin");
  const [linkedinSlug, setLinkedinSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [copied, setCopied] = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [maxReached, setMaxReached] = useState<WizardStep>(1);
  const [tourReplay, setTourReplay] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const linkedInSynced = useRef(false);

  const hasGitHub = Boolean(
    profile?.data_sources?.some((s) => s.platform === "github" && s.connected),
  );
  const hasSO = Boolean(
    profile?.data_sources?.some((s) => s.platform === "stackoverflow" && s.connected),
  );
  const hasDevpost = Boolean(
    profile?.data_sources?.some((s) => s.platform === "devpost" && s.connected),
  );
  const hasDevfolio = Boolean(
    profile?.data_sources?.some((s) => s.platform === "devfolio" && s.connected),
  );
  const hasLinkedIn = Boolean(
    profile?.data_sources?.some((s) => s.platform === "linkedin" && s.connected),
  );
  const linkedInHandle = profile?.data_sources?.find((s) => s.platform === "linkedin")?.external_id;

  useEffect(() => {
    const gh = searchParams.get("github");
    if (gh) setGithubUsername(gh);
    const step = searchParams.get("step");
    if (step === "2") {
      setWizardStep(2);
      setMaxReached((prev) => (prev < 2 ? 2 : prev) as WizardStep);
    }
    const linked = searchParams.get("linked");
    if (linked === "linkedin" && isSignedIn && isLoaded && !linkedInSynced.current) {
      linkedInSynced.current = true;
      void (async () => {
        const token = await getToken();
        if (!token) return;
        setConnecting(true);
        setError("");
        try {
          await clerkUser?.reload();
          const updated = await api.connectLinkedIn(token, linkedinSlug.trim() || undefined);
          setProfile(updated);
          setSourceTab("linkedin");
        } catch (err) {
          setError(err instanceof Error ? err.message : errors.linkedinConnectFailed);
        } finally {
          setConnecting(false);
        }
      })();
    }
  }, [searchParams, isSignedIn, isLoaded, getToken, clerkUser, linkedinSlug]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setSyncError("");
    const token = await getToken();
    if (!token) {
      setSyncError("Could not load your session. Refresh the page or sign in again.");
      setLoading(false);
      return;
    }
    try {
      const claimHandle = searchParams.get("claim") ?? undefined;
      const sync = await syncAccount(getToken, claimHandle);
      setAccountUser(sync.user ?? null);
      if (sync.user?.account_type === "recruiter") {
        router.replace(
          sync.user.recruiter_onboarding_complete ? routes.recruiterDashboard : routes.recruiterOnboarding,
        );
        return;
      }
      if (sync.profile) {
        const p = sync.profile;
        setProfile(p);
        if (!initialized) {
          const initial = deriveInitialStep(
            p,
            Boolean(p.data_sources?.some((s) => s.platform === "github" && s.connected)),
          );
          setWizardStep(initial);
          setMaxReached(initial);
          setInitialized(true);
        }
      } else if (
        sync.user?.account_type === "passport" &&
        sync.user.professional_segment &&
        !sync.shadowHandle
      ) {
        setSyncError("Your account was created but the profile is still setting up. Try again in a moment.");
      }
      if (sync.shadowHandle) setShadowHandle(sync.shadowHandle);
      if (sync.bootstrapMessage) setBootstrapMessage(sync.bootstrapMessage);

      if (sync.user?.account_type && sync.user.professional_segment) {
        setPreStep("wizard");
      } else if (sync.user?.account_type === "passport") {
        setPreStep("segment");
      } else if (sync.profile) {
        setPreStep("wizard");
      } else {
        setPreStep("account");
      }

      const ghSource = sync.profile?.data_sources?.find((s) => s.platform === "github");
      if (ghSource?.external_id) setGithubUsername(ghSource.external_id);
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Could not connect to TrustGraph. Is the API running?",
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, initialized, router, searchParams]);

  async function chooseAccountType(accountType: "passport" | "recruiter") {
    const token = await getToken();
    if (!token) return;
    setConnecting(true);
    setError("");
    try {
      const res = await api.setAccountType(token, accountType);
      setAccountUser(res.user);
      if (accountType === "recruiter") {
        router.push(routes.recruiterOnboarding);
        return;
      }
      setPreStep("segment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save account type");
    } finally {
      setConnecting(false);
    }
  }

  async function chooseSegment(segment: string) {
    const token = await getToken();
    if (!token) return;
    setConnecting(true);
    setError("");
    try {
      const res = await api.setProfessionalSegment(token, segment);
      setAccountUser(res.user);
      setProfile(res.profile);
      setPreStep("wizard");
      setWizardStep(1);
      setMaxReached(1);
      setInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save segment");
    } finally {
      setConnecting(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(routes.signIn);
      return;
    }
    void loadProfile();
  }, [isLoaded, isSignedIn, router, loadProfile]);

  const goToStep = useCallback((step: WizardStep) => {
    setWizardStep(step);
    setMaxReached((prev) => (step > prev ? step : prev) as WizardStep);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function connectGitHub() {
    const token = await getToken();
    if (!token || !githubUsername.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const updated = await api.connectGitHub(token, githubUsername.trim());
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : errors.githubConnectFailed);
    } finally {
      setConnecting(false);
    }
  }

  async function connectStackOverflow() {
    const token = await getToken();
    if (!token || !soUsername.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const updated = await api.connectStackOverflow(token, soUsername.trim());
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : errors.stackoverflowConnectFailed);
    } finally {
      setConnecting(false);
    }
  }

  async function connectLinkedIn() {
    const token = await getToken();
    if (!token) return;
    setConnecting(true);
    setError("");
    try {
      await clerkUser?.reload();
      const updated = await api.connectLinkedIn(token, linkedinSlug.trim() || undefined);
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : errors.linkedinConnectFailed);
    } finally {
      setConnecting(false);
    }
  }

  async function connectDevpost() {
    const token = await getToken();
    if (!token || !devpostUsername.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const updated = await api.connectDevpost(token, devpostUsername.trim());
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect Devpost");
    } finally {
      setConnecting(false);
    }
  }

  async function connectDevfolio() {
    const token = await getToken();
    if (!token || !devfolioUrl.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const updated = await api.connectDevfolio(token, devfolioUrl.trim());
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect Devfolio");
    } finally {
      setConnecting(false);
    }
  }

  async function addManualClaim() {
    const token = await getToken();
    if (!token || !claimTitle.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const url = claimURL.trim();
      const updated = await api.addManualClaim(token, {
        type: /workable\.com/i.test(url) ? "job_application" : "conference_talk",
        title: claimTitle.trim(),
        url,
      });
      setProfile(updated);
      setClaimTitle("");
      setClaimURL("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add claim");
    } finally {
      setConnecting(false);
    }
  }

  async function claimShadow() {
    const token = await getToken();
    if (!token || !shadowHandle) return;
    const updated = await api.claimProfile(token, shadowHandle);
    setProfile(updated);
    setShadowHandle("");
  }

  async function sendPeerInvite() {
    const token = await getToken();
    if (!token || !peerEmail.trim() || !peerSkill.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const res = await api.invitePeer(token, {
        verifier_email: peerEmail.trim(),
        skill_area: peerSkill.trim(),
        context: peerContext.trim(),
      });
      setConfirmUrl(res.confirm_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : errors.peerInviteFailed);
    } finally {
      setConnecting(false);
    }
  }

  async function finishOnboarding() {
    const token = await getToken();
    if (!token) return;
    await api.completeOnboarding(token);
    router.push(routes.dashboard);
  }

  function copyPassport() {
    if (!profile) return;
    navigator.clipboard.writeText(brand.passportFullUrl(profile.handle));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyBadge() {
    if (!profile) return;
    navigator.clipboard.writeText(badgeMarkdown(profile.handle));
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2000);
  }

  const stepMeta = useMemo(
    () => onboarding.steps.slice(0, WIZARD_STEP_COUNT),
    [],
  );

  const canContinue = useMemo(() => {
    switch (wizardStep) {
      case 1:
        return hasGitHub;
      case 2:
      case 3:
      case 4:
        return Boolean(profile);
      case 5:
        return true;
      default:
        return false;
    }
  }, [wizardStep, hasGitHub, profile]);

  function handleContinue() {
    if (wizardStep < WIZARD_STEP_COUNT) {
      goToStep((wizardStep + 1) as WizardStep);
    }
  }

  function handleBack() {
    if (wizardStep > 1) {
      goToStep((wizardStep - 1) as WizardStep);
    }
  }

  if (!isLoaded || loading) {
    return <OnboardingLoading />;
  }

  if (syncError) {
    return (
      <>
        <Navbar />
        <main className={`${layout.pageWithNavNarrow} text-center`}>
          <h1 className={typography.pageTitleLg}>Could not start onboarding</h1>
          <p className={`mt-4 ${states.error}`}>{syncError}</p>
          <p className="mt-2 text-sm text-muted">
            Make sure the backend is running at {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => void loadProfile()}>Try again</Button>
            <Button href={routes.dashboard} variant="secondary">
              Go to dashboard
            </Button>
          </div>
        </main>
      </>
    );
  }

  const passportUrl = profile ? brand.passportUrl(profile.handle) : "";

  return (
    <>
      <OnboardingTour wizardStep={wizardStep} hasGitHub={hasGitHub} replayToken={tourReplay} />
      <OnboardingShell>
        <Navbar />
        <main className={`${layout.pageWithNavNarrow} pb-12`}>
          <div
            data-tour="onboarding-header"
            className="flex flex-wrap items-start justify-between gap-4 rounded-[24px] border border-border bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-8"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal">{onboarding.eyebrow}</p>
              <h1 className={`mt-2 ${typography.pageTitleLg}`}>{onboarding.title}</h1>
              <p className="mt-3 max-w-xl text-muted">{onboarding.subtitle}</p>
            </div>
            <TourGuideButton onReplay={() => setTourReplay((n) => n + 1)} />
          </div>

          {bootstrapMessage && (
            <div className={`mt-6 ${surfaces.cardPadded} border-teal/20 bg-teal-light/20`}>
              <p className="font-semibold">{onboarding.clerkBootstrap.title}</p>
              <p className="mt-2 text-sm text-muted">{onboarding.clerkBootstrap.github}</p>
              {shadowHandle && (
                <Button className="mt-4" onClick={claimShadow}>
                  {onboarding.clerkBootstrap.claim}: @{shadowHandle}
                </Button>
              )}
            </div>
          )}

          {preStep === "wizard" && (
          <OnboardingProgress
            steps={stepMeta}
            current={wizardStep}
            maxReached={maxReached}
            onStepClick={(step) => goToStep(step as WizardStep)}
          />
          )}

          {preStep === "account" && (
            <div className="onboarding-step-enter mt-10">
              <AccountTypeStep loading={connecting} onSelect={chooseAccountType} />
              {error && <p className={`mt-4 ${states.error}`}>{error}</p>}
            </div>
          )}

          {preStep === "segment" && (
            <div className="onboarding-step-enter mt-10">
              <SegmentPicker
                title="What best describes you?"
                subtitle="Trust Passport"
                loading={connecting}
                onSelect={chooseSegment}
              />
              {error && <p className={`mt-4 ${states.error}`}>{error}</p>}
            </div>
          )}

          {preStep === "wizard" && (
          <div key={wizardStep} data-tour="onboarding-step-panel" className="onboarding-step-enter mt-10">
            {wizardStep === 1 && (
              <StepGitHub
                profile={profile}
                githubUsername={githubUsername}
                setGithubUsername={setGithubUsername}
                connecting={connecting}
                error={error}
                onConnect={connectGitHub}
              />
            )}

            {wizardStep === 2 && (
              <StepSources
                activeTab={sourceTab}
                setActiveTab={setSourceTab}
                soUsername={soUsername}
                setSoUsername={setSoUsername}
                devpostUsername={devpostUsername}
                setDevpostUsername={setDevpostUsername}
                devfolioUrl={devfolioUrl}
                setDevfolioUrl={setDevfolioUrl}
                claimTitle={claimTitle}
                setClaimTitle={setClaimTitle}
                claimURL={claimURL}
                setClaimURL={setClaimURL}
                connecting={connecting}
                error={error}
                hasLinkedIn={hasLinkedIn}
                hasSO={hasSO}
                hasDevpost={hasDevpost}
                hasDevfolio={hasDevfolio}
                linkedInHandle={linkedInHandle}
                linkedinSlug={linkedinSlug}
                setLinkedinSlug={setLinkedinSlug}
                onConnectLinkedIn={connectLinkedIn}
                onLinkedInOAuthError={setError}
                onConnectSO={connectStackOverflow}
                onConnectDevpost={connectDevpost}
                onConnectDevfolio={connectDevfolio}
                onAddClaim={addManualClaim}
              />
            )}

            {wizardStep === 3 && profile && <StepScoreReveal profile={profile} />}

            {wizardStep === 4 && profile && (
              <StepPassport
                profile={profile}
                passportUrl={passportUrl}
                copied={copied}
                badgeCopied={badgeCopied}
                onCopyPassport={copyPassport}
                onCopyBadge={copyBadge}
              />
            )}

            {wizardStep === 5 && profile && (
              <StepPeerVerify
                peerEmail={peerEmail}
                setPeerEmail={setPeerEmail}
                peerSkill={peerSkill}
                setPeerSkill={setPeerSkill}
                peerContext={peerContext}
                setPeerContext={setPeerContext}
                connecting={connecting}
                error={error}
                confirmUrl={confirmUrl}
                onSend={sendPeerInvite}
              />
            )}
          </div>
          )}

          {preStep === "wizard" && (
          <OnboardingNavFooter
            wizardStep={wizardStep}
            canContinue={canContinue}
            onBack={handleBack}
            onContinue={handleContinue}
            onSkipSources={wizardStep === 2 ? handleContinue : undefined}
            onFinish={finishOnboarding}
            onSkipToDashboard={() => router.push(routes.dashboard)}
          />
          )}
        </main>
      </OnboardingShell>
    </>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingContent />
    </Suspense>
  );
}
