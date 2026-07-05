"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { OnboardingLoading } from "@/components/onboarding/OnboardingLoading";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { SegmentPicker } from "@/components/onboarding/AccountTypeStep";
import { ScoreDimensionsExplainer } from "@/components/profile/ScoreDimensionsExplainer";
import { Button } from "@/components/ui/Button";
import { routes } from "@/constants";
import { layout, states, surfaces, typography } from "@/constants/styles";
import { api, RecruiterCompany, User } from "@/lib/api";
import { syncAccount } from "@/lib/sync-account";

type Step = "company" | "page" | "scrape" | "scoring" | "segment";

function RecruiterOnboardingContent() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>("company");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [linkedInURL, setLinkedInURL] = useState("");
  const [websiteURL, setWebsiteURL] = useState("");
  const [noLinkedIn, setNoLinkedIn] = useState(false);
  const [companyPreview, setCompanyPreview] = useState<RecruiterCompany | null>(null);
  const [cachedCompany, setCachedCompany] = useState(false);
  const [hiringSegment, setHiringSegment] = useState("developer");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const sync = await syncAccount(getToken);
      setUser(sync.user ?? null);
      if (sync.user?.account_type === "passport") {
        router.replace(routes.onboarding);
        return;
      }
      if (sync.user?.recruiter_onboarding_complete) {
        router.replace(routes.recruiterDashboard);
        return;
      }
      if (sync.user?.account_type !== "recruiter") {
        await api.setAccountType(token, "recruiter");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load account");
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(routes.signIn);
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, router, load]);

  async function scrapeCompany() {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.lookupRecruiterCompany(token, {
        name: companyName.trim(),
        email: companyEmail.trim(),
        linkedin_url: noLinkedIn ? undefined : linkedInURL.trim(),
        website_url: noLinkedIn ? websiteURL.trim() : linkedInURL.trim() || websiteURL.trim(),
      });
      setCompanyPreview({
        ...res.company,
        name: res.company.name || companyName.trim(),
        email: res.company.email || companyEmail.trim(),
      });
      setCachedCompany(res.cached);
      setStep("scrape");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load company details");
    } finally {
      setBusy(false);
    }
  }

  async function finishRecruiterOnboarding(segment = hiringSegment) {
    const token = await getToken();
    if (!token || !companyPreview) return;
    setBusy(true);
    setError("");
    try {
      await api.completeRecruiterOnboarding(token, {
        name: companyPreview.name || companyName.trim(),
        email: companyPreview.email || companyEmail.trim(),
        linkedin_url: noLinkedIn ? undefined : linkedInURL.trim(),
        website_url: noLinkedIn ? websiteURL.trim() : linkedInURL.trim() || websiteURL.trim(),
        hiring_segment: segment,
      });
      router.push(routes.recruiterDashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete onboarding");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded || loading) {
    return <OnboardingLoading />;
  }

  return (
    <OnboardingShell>
      <Navbar />
      <main className={`${layout.pageWithNavNarrow} pb-12`}>
        <div className={`${surfaces.cardPadded} mb-8`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Recruiter onboarding</p>
          <h1 className={`mt-2 ${typography.pageTitleLg}`}>Set up your hiring workspace</h1>
          <p className="mt-3 max-w-2xl text-muted">
            We verify your company once, then you can search TrustGraph&apos;s knowledge base for evidence-backed
            candidates.
          </p>
        </div>

        {error && <p className={`mb-6 ${states.error}`}>{error}</p>}

        {step === "company" && (
          <div className={`${surfaces.cardPadded} space-y-5`}>
            <div>
              <label className="text-sm font-medium text-ink">Company name</label>
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Labs"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Company email</label>
              <input
                className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <Button
              disabled={!companyName.trim() || !companyEmail.trim() || busy}
              onClick={() => setStep("page")}
            >
              Continue
            </Button>
          </div>
        )}

        {step === "page" && (
          <div className={`${surfaces.cardPadded} space-y-5`}>
            {!noLinkedIn ? (
              <div>
                <label className="text-sm font-medium text-ink">Company LinkedIn page</label>
                <input
                  className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3"
                  value={linkedInURL}
                  onChange={(e) => setLinkedInURL(e.target.value)}
                  placeholder="https://linkedin.com/company/acme"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-ink">Company website</label>
                <input
                  className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3"
                  value={websiteURL}
                  onChange={(e) => setWebsiteURL(e.target.value)}
                  placeholder="https://acme.com"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setNoLinkedIn(true);
                  setLinkedInURL("");
                }}
              >
                Company doesn&apos;t have LinkedIn
              </Button>
              <Button
                disabled={
                  busy ||
                  (!noLinkedIn && !linkedInURL.trim()) ||
                  (noLinkedIn && !websiteURL.trim())
                }
                onClick={() => void scrapeCompany()}
              >
                {busy ? "Loading company…" : "Continue & verify company"}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setStep("company")}>
              Back
            </Button>
          </div>
        )}

        {step === "scrape" && companyPreview && (
          <div className="space-y-6">
            <div className={`${surfaces.cardPadded}`}>
              <p className="text-sm font-semibold text-teal">
                {cachedCompany ? "Loaded from TrustGraph company records" : "Verified live from company page"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{companyPreview.name}</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {companyPreview.industry && (
                  <div>
                    <dt className="text-muted">Industry</dt>
                    <dd className="font-medium">{companyPreview.industry}</dd>
                  </div>
                )}
                {companyPreview.location && (
                  <div>
                    <dt className="text-muted">Location</dt>
                    <dd className="font-medium">{companyPreview.location}</dd>
                  </div>
                )}
                {companyPreview.size && (
                  <div>
                    <dt className="text-muted">Company size</dt>
                    <dd className="font-medium">{companyPreview.size}</dd>
                  </div>
                )}
                {companyPreview.description && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted">About</dt>
                    <dd className="font-medium">{companyPreview.description}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className={`${surfaces.cardPadded} border-teal/20 bg-teal-light/20`}>
              <p className="text-sm font-semibold text-[#111111]">Before you search candidates</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                TrustGraph ranks candidates with a transparent 0–100 score built from four
                evidence-backed dimensions — not resumes or self-reported skills. Next, we&apos;ll
                show exactly how each dimension is calculated.
              </p>
              <Button className="mt-4" onClick={() => setStep("scoring")}>
                How we score candidates
              </Button>
            </div>
          </div>
        )}

        {step === "scoring" && (
          <div className="space-y-6">
            <div className={surfaces.cardPadded}>
              <ScoreDimensionsExplainer variant="recruiter" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setStep("segment")}>Continue to hiring focus</Button>
              <Button variant="ghost" onClick={() => setStep("scrape")}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === "segment" && companyPreview && (
          <div className="space-y-6">
            <div className={`${surfaces.cardPadded}`}>
              <p className="text-sm font-semibold text-teal">Company verified</p>
              <h2 className="mt-2 text-xl font-semibold">{companyPreview.name}</h2>
              <p className="mt-2 text-sm text-muted">
                Choose your hiring focus. Candidate Trust Scores use the four dimensions above —
                evidence depth, consistency, peer verification, and impact.
              </p>
            </div>

            <SegmentPicker
              title="What are you looking for?"
              subtitle="Hiring focus"
              loading={busy}
              onSelect={(segment) => {
                setHiringSegment(segment);
                void finishRecruiterOnboarding(segment);
              }}
            />
          </div>
        )}
      </main>
    </OnboardingShell>
  );
}

export default function RecruiterOnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <RecruiterOnboardingContent />
    </Suspense>
  );
}
