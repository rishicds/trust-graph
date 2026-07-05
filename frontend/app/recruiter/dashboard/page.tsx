"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { OnboardingLoading } from "@/components/onboarding/OnboardingLoading";
import { RecruiterCompanyCard } from "@/components/recruiter/RecruiterCompanyCard";
import { CandidateResultCard } from "@/components/recruiter/CandidateResultCard";
import { HiringSegmentSelector } from "@/components/recruiter/HiringSegmentSelector";
import { RecruiterPromptGuide } from "@/components/recruiter/RecruiterPromptGuide";
import { RecruiterSearchFiltersPanel } from "@/components/recruiter/RecruiterSearchFiltersPanel";
import { SavedCandidatesPanel } from "@/components/recruiter/SavedCandidatesPanel";
import { Button } from "@/components/ui/Button";
import { routes } from "@/constants";
import { layout, states, surfaces, typography } from "@/constants/styles";
import {
  api,
  CandidateSearchResult,
  RecruiterCompany,
  RecruiterSavedCandidate,
  RecruiterSearchFilters,
  RecruiterSearchMeta,
  User,
} from "@/lib/api";
import { syncAccount } from "@/lib/sync-account";
import { cn } from "@/lib/utils";

type Tab = "search" | "starred" | "company";

function RecruiterDashboardContent() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<RecruiterCompany | null>(null);
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<RecruiterSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<RecruiterSearchMeta | null>(null);
  const [saved, setSaved] = useState<RecruiterSavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [starringHandle, setStarringHandle] = useState<string | null>(null);
  const [deepSearchHandle, setDeepSearchHandle] = useState<string | null>(null);
  const [companyRefreshing, setCompanyRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const loadSaved = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setSavedLoading(true);
    try {
      const res = await api.listRecruiterSaved(token);
      setSaved(res.saved);
    } catch {
      // non-fatal
    } finally {
      setSavedLoading(false);
    }
  }, [getToken]);

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
      let currentUser = sync.user ?? null;
      if (currentUser?.account_type !== "recruiter") {
        router.replace(routes.onboarding);
        return;
      }
      if (!currentUser?.recruiter_onboarding_complete) {
        router.replace(routes.recruiterOnboarding);
        return;
      }
      if (currentUser && !currentUser.hiring_segment) {
        await api.setRecruiterHiringSegment(token, "developer");
        currentUser = { ...currentUser, hiring_segment: "developer" };
      }
      setUser(currentUser);
      const companyRes = await api.getRecruiterCompany(token);
      setCompany(companyRes.company);
      await loadSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load recruiter workspace");
    } finally {
      setLoading(false);
    }
  }, [getToken, router, loadSaved]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(routes.signIn);
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, router, load]);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const token = await getToken();
    if (!token || !query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await api.recruiterCandidateSearch(
        token,
        query.trim(),
        user?.hiring_segment || "developer",
        filters,
      );
      setResults(res.results);
      setSearchMeta(res.meta);
      setHasSearched(true);
      setTab("search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function toggleStar(handle: string, starred: boolean) {
    const token = await getToken();
    if (!token) return;
    setStarringHandle(handle);
    try {
      if (starred) {
        await api.starRecruiterCandidate(token, {
          handle,
          saved_from_query: query.trim() || undefined,
        });
      } else {
        await api.unstarRecruiterCandidate(token, handle);
      }
      setResults((prev) =>
        prev.map((c) => (c.handle === handle ? { ...c, starred } : c)),
      );
      await loadSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update star");
    } finally {
      setStarringHandle(null);
    }
  }

  async function unstarSaved(handle: string) {
    const token = await getToken();
    if (!token) return;
    try {
      await api.unstarRecruiterCandidate(token, handle);
      setResults((prev) =>
        prev.map((c) => (c.handle === handle ? { ...c, starred: false } : c)),
      );
      await loadSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove star");
    }
  }

  async function refreshCompany() {
    const token = await getToken();
    if (!token) return;
    setCompanyRefreshing(true);
    setError("");
    try {
      const res = await api.refreshRecruiterCompany(token);
      setCompany(res.company);
      setActionMessage("Company profile refreshed from LinkedIn / website.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh company profile");
    } finally {
      setCompanyRefreshing(false);
    }
  }

  async function runDeepSearch(handle: string) {
    const token = await getToken();
    if (!token) return;
    setDeepSearchHandle(handle);
    setError("");
    try {
      const res = await api.startRecruiterSearch(handle, token);
      setActionMessage(
        res.message ||
          `Deep search started for @${handle}. Open their passport to view the recruiter report when it completes.`,
      );
      window.open(`${routes.sampleProfile(handle)}?recruiter=1`, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start deep search");
    } finally {
      setDeepSearchHandle(null);
    }
  }

  if (!isLoaded || loading) {
    return <OnboardingLoading />;
  }

  const parsed = searchMeta?.parsed_query;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navbar />
      <main className={`${layout.pageWithNav} pb-16`}>
        <div className={`${surfaces.cardPadded} mb-8`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Recruiter workspace</p>
          <h1 className={`mt-2 ${typography.pageTitleLg}`}>
            {company?.name ? `${company.name} hiring` : "Recruiter dashboard"}
          </h1>
          <p className="mt-3 max-w-3xl text-muted">
            Search indexed passports and the public web. Structured prompts filter by skills, tools,
            location, and employer — so unrelated profiles drop out.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("search")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              tab === "search" ? "bg-ink text-white" : "border border-border bg-white text-muted",
            )}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setTab("starred")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              tab === "starred" ? "bg-ink text-white" : "border border-border bg-white text-muted",
            )}
          >
            Starred {saved.length > 0 ? `(${saved.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setTab("company")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              tab === "company" ? "bg-ink text-white" : "border border-border bg-white text-muted",
            )}
          >
            Company
          </button>
        </div>

        {actionMessage && tab === "search" && (
          <p className="mb-6 rounded-xl border border-teal/20 bg-teal-light/40 px-4 py-3 text-sm text-ink">
            {actionMessage}
          </p>
        )}

        {tab === "search" && (
          <>
            <div className="mb-8">
              <HiringSegmentSelector
                value={user?.hiring_segment || "developer"}
                onChange={async (segment) => {
                  const token = await getToken();
                  if (!token) return;
                  await api.setRecruiterHiringSegment(token, segment);
                  setUser((prev) => (prev ? { ...prev, hiring_segment: segment } : prev));
                }}
              />
            </div>

            <div className={`${surfaces.cardPadded} mb-8`}>
              <RecruiterPromptGuide onUseExample={setQuery} />
            </div>

            <form onSubmit={(e) => void runSearch(e)} className={`${surfaces.cardPadded} mb-8`}>
              <label className="text-sm font-medium text-ink">Find your ideal candidate</label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <textarea
                  className="min-h-[88px] flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm leading-relaxed"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="I need a developer proficient in TypeScript, worked on Kubernetes, lives in Berlin, worked at DevRelSquad"
                />
                <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                  <Button type="submit" disabled={searching || !query.trim()}>
                    {searching ? "Searching…" : "Search"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    {showFilters ? "Hide filters" : "Filters"}
                  </Button>
                </div>
              </div>
              {showFilters && (
                <RecruiterSearchFiltersPanel filters={filters} onChange={setFilters} />
              )}
              {error && <p className={`mt-3 ${states.error}`}>{error}</p>}
            </form>

            {hasSearched && (
              <div className="space-y-4">
                {parsed && (parsed.skills?.length || parsed.tools?.length || parsed.location || parsed.employers?.length) && (
                  <div className={`${surfaces.cardPadded} text-sm`}>
                    <p className="font-medium text-ink">Parsed from your prompt</p>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-muted">
                      {parsed.skills && parsed.skills.length > 0 && (
                        <div>
                          <dt className="inline font-medium text-ink">Skills: </dt>
                          <dd className="inline">{parsed.skills.join(", ")}</dd>
                        </div>
                      )}
                      {parsed.tools && parsed.tools.length > 0 && (
                        <div>
                          <dt className="inline font-medium text-ink">Tools: </dt>
                          <dd className="inline">{parsed.tools.join(", ")}</dd>
                        </div>
                      )}
                      {parsed.location && (
                        <div>
                          <dt className="inline font-medium text-ink">Location: </dt>
                          <dd className="inline">{parsed.location}</dd>
                        </div>
                      )}
                      {parsed.employers && parsed.employers.length > 0 && (
                        <div>
                          <dt className="inline font-medium text-ink">Employer: </dt>
                          <dd className="inline">
                            {parsed.employers.join(", ")}
                            {parsed.require_employer ? " (required)" : ""}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                <p className="text-sm text-muted">
                  {results.length} candidate{results.length === 1 ? "" : "s"}
                  {searchMeta && (
                    <>
                      {" "}
                      — {searchMeta.indexed_count} indexed
                      {searchMeta.tavily_used && (
                        <>
                          , {searchMeta.web_discovered_count} from web
                          {searchMeta.web_results_reviewed > 0 &&
                            ` (${searchMeta.web_results_reviewed} pages via Tavily${searchMeta.firecrawl_used ? " + Firecrawl" : ""})`}
                        </>
                      )}
                      {(searchMeta.filtered_out ?? 0) > 0 &&
                        ` · ${searchMeta.filtered_out} filtered out (missing employer/skills/location)`}
                    </>
                  )}
                </p>
                {results.length === 0 ? (
                  <div className={`${surfaces.cardPadded} text-muted`}>
                    No matches after filters. Try broadening skills or turning off strict employer
                    matching under Filters.
                  </div>
                ) : (
                  results.map((candidate, index) => (
                    <CandidateResultCard
                      key={candidate.handle}
                      candidate={candidate}
                      rank={index + 1}
                      onToggleStar={toggleStar}
                      onDeepSearch={runDeepSearch}
                      starring={starringHandle === candidate.handle}
                      deepSearching={deepSearchHandle === candidate.handle}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}

        {tab === "starred" && (
          <SavedCandidatesPanel saved={saved} loading={savedLoading} onRemove={unstarSaved} />
        )}

        {tab === "company" && (
          <RecruiterCompanyCard
            company={company}
            onRefresh={() => void refreshCompany()}
            refreshing={companyRefreshing}
          />
        )}
      </main>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <RecruiterDashboardContent />
    </Suspense>
  );
}
