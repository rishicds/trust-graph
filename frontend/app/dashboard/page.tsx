"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { ConnectedSourcesPanel } from "@/components/dashboard/ConnectedSourcesPanel";
import { Navbar } from "@/components/layout/Navbar";
import { TrustScoreDisplay } from "@/components/profile/TrustScoreDisplay";
import { ScoreHistoryChart } from "@/components/profile/ScoreHistoryChart";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Card";
import { brand, dashboard, routes } from "@/constants";
import { layout, states, surfaces, typography } from "@/constants/styles";
import { ActivityAlert, api, ComparativeInsight, Profile, ScoreHistoryPoint, User } from "@/lib/api";
import { badgeMarkdown, embedIframeSnippet } from "@/lib/badge";
import { syncAccount } from "@/lib/sync-account";

export default function DashboardPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { signOut } = useClerk();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState("free");
  const [alerts, setAlerts] = useState<ActivityAlert[]>([]);
  const [insights, setInsights] = useState<ComparativeInsight[]>([]);
  const [insightsLocked, setInsightsLocked] = useState(false);
  const [history, setHistory] = useState<ScoreHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(routes.signIn);
      return;
    }

    async function load() {
      const token = await getToken();
      if (!token) {
        setLoadError("Could not load your session. Refresh the page or sign in again.");
        setLoading(false);
        return;
      }
      try {
        const sync = await syncAccount(getToken);
        if (sync.profile) setProfile(sync.profile);

        const res = await api.me(token);
        setUser(res.user);
        setPlan((res as { plan?: string }).plan ?? res.user.plan ?? "free");
        if (res.profile) setProfile(res.profile as Profile);

        const alertRes = await api.getAlerts(token);
        setAlerts(alertRes.alerts ?? []);
        setInsights(alertRes.insights ?? []);
        setInsightsLocked(Boolean(alertRes.insights_locked));

        if ((res as { plan?: string }).plan === "pro" || res.user.plan === "pro") {
          try {
            const hist = await api.scoreHistory(token);
            setHistory(hist.history ?? []);
          } catch {
            setHistory([]);
          }
        }
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Could not load your dashboard. Is the API running?",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [isLoaded, isSignedIn, getToken, router]);

  async function logout() {
    await signOut();
    router.push(routes.home);
  }

  async function upgradePro() {
    const token = await getToken();
    if (!token) return;
    const res = await api.createCheckout(token);
    window.location.href = res.checkout_url;
  }

  function copyBadge() {
    if (!profile) return;
    navigator.clipboard.writeText(badgeMarkdown(profile.handle));
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2000);
  }

  function copyEmbed() {
    if (!profile) return;
    navigator.clipboard.writeText(embedIframeSnippet(profile.handle));
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  }

  if (!isLoaded || loading) {
    return <div className={states.loading}>{dashboard.loading}</div>;
  }

  if (loadError) {
    return (
      <>
        <Navbar />
        <main className={`${layout.pageWithNav} text-center`}>
          <h1 className={typography.pageTitle}>Could not load dashboard</h1>
          <p className={`mt-4 ${states.error}`}>{loadError}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button href={routes.onboarding} variant="secondary">
              Start onboarding
            </Button>
          </div>
        </main>
      </>
    );
  }

  const isPro = plan === "pro";

  return (
    <>
      <Navbar />
      <main className={layout.pageWithNav}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted">{dashboard.eyebrow}</p>
            <h1 className={typography.pageTitle}>{dashboard.welcome(user?.name ?? "")}</h1>
          </div>
          <div className="flex gap-3">
            {profile && (
              <Button href={routes.sampleProfile(profile.handle)} variant="ghost">
                {dashboard.viewProfile}
              </Button>
            )}
            <Button href={routes.settings} variant="ghost">
              Settings
            </Button>
            <Button variant="secondary" onClick={logout}>
              {dashboard.logout}
            </Button>
          </div>
        </div>

        {!profile ? (
          <div className={`mt-10 ${surfaces.cardPadded} text-center`}>
            <p className="text-lg font-semibold">{dashboard.empty.title}</p>
            <p className="mt-2 text-muted">{dashboard.empty.subtitle}</p>
            <Button href={routes.onboarding} className="mt-6">
              {dashboard.empty.cta}
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className={`${surfaces.cardPadded} lg:col-span-3`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">{dashboard.passport.title}</h2>
                  <p className="mt-1 text-sm text-muted">{brand.passportUrl(profile.handle)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button href={routes.sampleProfile(profile.handle)}>
                    View passport
                  </Button>
                  {profile.onboarding_step < 5 && (
                    <Button href={routes.onboarding} variant="secondary">
                      {dashboard.passport.continue}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className={`${surfaces.cardPadded} lg:col-span-2 space-y-8`}>
              <div>
                <div className="flex items-center gap-2">
                  <Pill verified>{dashboard.trustScore}</Pill>
                  {isPro && <Pill verified>Pro</Pill>}
                  {profile.onboarding_step < 5 && <Pill>{dashboard.onboardingIncomplete}</Pill>}
                </div>
                <div className="mt-6">
                  <TrustScoreDisplay score={profile.trust_score} />
                </div>
              </div>

              <div>
                <h2 className="font-semibold">{dashboard.history?.title ?? "Score history"}</h2>
                {isPro ? (
                  <div className="mt-4">
                    <ScoreHistoryChart history={history} />
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm text-muted">Upgrade to Pro to unlock score history and comparative insights.</p>
                    <Button className="mt-3" onClick={upgradePro}>Upgrade to Pro</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={surfaces.cardPadded}>
                <h2 className="font-semibold">{dashboard.alerts.title}</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {alerts.length ? (
                    alerts.map((alert, i) => (
                      <li key={i} className="rounded-[12px] border border-border px-3 py-2 text-muted">
                        {alert.message}
                      </li>
                    ))
                  ) : (
                    <li className="text-muted">{dashboard.alerts.empty}</li>
                  )}
                </ul>
              </div>

              <div className={surfaces.cardPadded}>
                <h2 className="font-semibold">{dashboard.insights.title}</h2>
                {insightsLocked ? (
                  <div className="mt-4">
                    <p className="text-sm text-muted">Comparative insights are a Pro feature.</p>
                    <Button className="mt-3 w-full" onClick={upgradePro}>Upgrade to Pro</Button>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {insights.slice(0, 4).map((item) => (
                      <li key={item.dimension}>{item.message}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={surfaces.cardPadded}>
                <h2 className="font-semibold">{dashboard.badge.title}</h2>
                <p className="mt-1 text-sm text-muted">{dashboard.badge.description}</p>
                <img src={api.badgeUrl(profile.handle)} alt="" className="mt-3 h-7" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">README markdown</p>
                <code className={`mt-2 block ${surfaces.codeBlockSm}`}>{badgeMarkdown(profile.handle)}</code>
                <Button variant="secondary" className="mt-3 w-full" onClick={copyBadge}>
                  {badgeCopied ? "Copied!" : "Copy badge markdown"}
                </Button>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Embed widget</p>
                <code className={`mt-2 block ${surfaces.codeBlockSm}`}>{embedIframeSnippet(profile.handle)}</code>
                <Button variant="secondary" className="mt-3 w-full" onClick={copyEmbed}>
                  {embedCopied ? "Copied!" : "Copy embed HTML"}
                </Button>
              </div>

              <Suspense fallback={<div className={surfaces.cardPadded}>Loading sources…</div>}>
                <ConnectedSourcesPanel profile={profile} onProfileUpdate={setProfile} />
              </Suspense>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
