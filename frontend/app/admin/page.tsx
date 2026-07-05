"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Card";
import { brand, routes } from "@/constants";
import { layout, links, states, surfaces, typography } from "@/constants/styles";
import {
  AdminDisputeRow,
  AdminProfileRow,
  AdminStats,
  AdminUserRow,
  api,
} from "@/lib/api";
import { AdminNewsletterComposer } from "@/components/admin/AdminNewsletterComposer";

export default function AdminPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [githubUser, setGithubUser] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [profileTotal, setProfileTotal] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<AdminDisputeRow[]>([]);
  const [openDisputeCount, setOpenDisputeCount] = useState(0);
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [profileActionHandle, setProfileActionHandle] = useState<string | null>(null);
  const [profileActionError, setProfileActionError] = useState<string | null>(null);
  const [profileActionMessage, setProfileActionMessage] = useState<string | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [emailReady, setEmailReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(routes.signIn);
      return;
    }

    async function load() {
      const token = await getToken();
      if (!token) {
        router.replace(routes.signIn);
        return;
      }

      try {
        await api.syncClerk(token);
        const me = await api.adminMe(token);
        if (!me.admin) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        setGithubUser(me.github_username);
        setEmailReady(me.email_configured ?? false);

        const [statsRes, profilesRes, usersRes, disputesRes] = await Promise.all([
          api.adminStats(token),
          api.adminProfiles(token),
          api.adminUsers(token),
          api.adminDisputes(token),
        ]);
        setStats(statsRes);
        setProfiles(profilesRes.profiles ?? []);
        setProfileTotal(profilesRes.total ?? 0);
        setUsers(usersRes.users ?? []);
        setDisputes(disputesRes.disputes ?? []);
        setOpenDisputeCount(disputesRes.open_count ?? 0);

        try {
          const newsletterRes = await api.adminNewsletterSubscribers(token);
          setSubscriberCount(newsletterRes.total ?? 0);
          setEmailReady(newsletterRes.email_ready ?? me.email_configured ?? false);
        } catch {
          // Newsletter ops are optional; don't block admin access if this endpoint is unavailable.
          setSubscriberCount(0);
        }
      } catch (e) {
        console.error("Admin panel load failed:", e);
        setForbidden(true);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [isLoaded, isSignedIn, getToken, router]);

  async function resolveDispute(dispute: AdminDisputeRow, action: "dismiss" | "unclaim") {
    const token = await getToken();
    if (!token) return;
    setDisputeError(null);
    setResolvingDisputeId(dispute.id);
    try {
      await api.adminResolveDispute(token, dispute.id, { action });
      const disputesRes = await api.adminDisputes(token);
      setDisputes(disputesRes.disputes ?? []);
      setOpenDisputeCount(disputesRes.open_count ?? 0);
      if (action === "unclaim") {
        const profilesRes = await api.adminProfiles(token);
        setProfiles(profilesRes.profiles ?? []);
      }
    } catch (e) {
      setDisputeError(e instanceof Error ? e.message : "Could not resolve dispute");
    } finally {
      setResolvingDisputeId(null);
    }
  }

  async function rerunRecruiter(handle: string) {
    const token = await getToken();
    if (!token) return;
    setProfileActionError(null);
    setProfileActionMessage(null);
    setProfileActionHandle(handle);
    try {
      const res = await api.adminRerunRecruiterSearch(token, handle);
      setProfileActionMessage(`Recruiter search queued for @${handle} (run ${res.run_id})`);
    } catch (e) {
      setProfileActionError(e instanceof Error ? e.message : "Recruiter rerun failed");
    } finally {
      setProfileActionHandle(null);
    }
  }

  async function rescrapeProfile(handle: string) {
    const token = await getToken();
    if (!token) return;
    setProfileActionError(null);
    setProfileActionMessage(null);
    setProfileActionHandle(handle);
    try {
      const res = await api.adminRescrapeProfile(token, handle);
      setProfileActionMessage(res.message);
      const profilesRes = await api.adminProfiles(token);
      setProfiles(profilesRes.profiles ?? []);
    } catch (e) {
      setProfileActionError(e instanceof Error ? e.message : "Rescrape failed");
    } finally {
      setProfileActionHandle(null);
    }
  }

  async function toggleUserPlan(user: AdminUserRow) {
    const token = await getToken();
    if (!token) return;

    const nextPlan = user.plan === "pro" ? "free" : "pro";
    setPlanError(null);
    setUpdatingUserId(user.id);
    try {
      const res = await api.adminSetUserPlan(token, user.id, nextPlan);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              pro_users: prev.pro_users + (nextPlan === "pro" ? 1 : -1),
            }
          : prev,
      );
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Could not update plan");
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (!isLoaded || loading) {
    return (
      <>
        <Navbar />
        <div className={`${layout.pageWithNav} ${states.loading}`}>Loading admin…</div>
      </>
    );
  }

  if (forbidden) {
    return (
      <>
        <Navbar />
        <main className={`${layout.pageWithNav} pt-32 pb-20`}>
          <div className={`mx-auto max-w-lg text-center ${surfaces.cardPaddedLg}`}>
            <h1 className={typography.pageTitle}>Access denied</h1>
            <p className="mt-3 text-muted">
              Admin access requires an authorized GitHub account or admin email.
            </p>
            <Button href={routes.dashboard} className="mt-6" variant="secondary">
              Back to dashboard
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={`${layout.pageWithNav} pt-32 pb-20`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal">Admin</p>
            <h1 className={`mt-2 ${typography.pageTitleLg}`}>TrustGraph control panel</h1>
            <p className="mt-2 text-muted">
              Signed in as{" "}
              <span className="font-mono text-teal">
                {githubUser.includes("@") ? githubUser : `@${githubUser}`}
              </span>
            </p>
          </div>
          <Button href={routes.dashboard} variant="ghost">
            Dashboard
          </Button>
        </div>

        {stats && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Users" value={stats.users} />
            <StatCard label="Profiles" value={stats.profiles} />
            <StatCard label="Shadow profiles" value={stats.shadow_profiles} />
            <StatCard label="Pro users" value={stats.pro_users} />
            <StatCard label="Claimed" value={stats.claimed_profiles} />
            <StatCard label="Private" value={stats.private_profiles} />
          </div>
        )}

        <section className={`mt-10 ${surfaces.cardPadded}`}>
          <h2 className="text-lg font-semibold">Ops quick reference</h2>
          <ul className="mt-4 space-y-2 font-mono text-xs text-muted">
            <li>Fetch gitstar users: <code className={surfaces.codeBlockSm}>go run ./cmd/seed-shadows -gitstar -fetch-only -pages 10</code></li>
            <li>Seed shadows: <code className={surfaces.codeBlockSm}>go run ./cmd/seed-shadows -gitstar -pages 1</code></li>
            <li>Health: <Link href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/health`} className={links.inlineUnderline}>API /health</Link></li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            Open disputes ({openDisputeCount})
          </h2>
          {disputeError && <p className="mt-2 text-sm text-red-600">{disputeError}</p>}
          {disputes.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No open disputes.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {disputes.map((d) => (
                <div key={d.id} className={surfaces.cardPadded}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={routes.sampleProfile(d.profile_handle)}
                        className="font-semibold hover:text-teal"
                      >
                        @{d.profile_handle}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {d.reason}
                        {d.reporter_email && ` · ${d.reporter_email}`}
                      </p>
                      {d.details && (
                        <p className="mt-2 text-sm leading-relaxed">{d.details}</p>
                      )}
                      <p className="mt-2 text-xs text-muted">Filed {d.created_at}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        className="px-3 py-1.5 text-xs"
                        disabled={resolvingDisputeId === d.id}
                        onClick={() => void resolveDispute(d, "dismiss")}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        disabled={resolvingDisputeId === d.id}
                        onClick={() => void resolveDispute(d, "unclaim")}
                      >
                        Unclaim profile
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Profiles ({profileTotal})</h2>
          </div>
          {profileActionError && <p className="mt-2 text-sm text-red-600">{profileActionError}</p>}
          {profileActionMessage && <p className="mt-2 text-sm text-teal">{profileActionMessage}</p>}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 pr-4 font-medium">Handle</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Evidence</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Onboarding</th>
                  <th className="py-2 font-medium">Ops</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.handle} className="border-b border-border/60">
                    <td className="py-3 pr-4">
                      <Link href={routes.sampleProfile(p.handle)} className="font-medium hover:text-teal">
                        {p.display_name || p.handle}
                      </Link>
                      <p className="font-mono text-xs text-muted">/{p.handle}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono">
                      {Number(p.trust_score ?? 0).toFixed(0)}
                    </td>
                    <td className="py-3 pr-4">{p.evidence_count}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {p.is_shadow && !p.is_claimed && <Pill>Shadow</Pill>}
                        {p.is_private && <Pill>Private</Pill>}
                        {p.has_user && <Pill verified>Claimed</Pill>}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted">Step {p.onboarding_step}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          className="px-3 py-1.5 text-xs"
                          disabled={profileActionHandle === p.handle}
                          onClick={() => void rescrapeProfile(p.handle)}
                        >
                          {profileActionHandle === p.handle ? "Working…" : "Rescrape"}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          disabled={profileActionHandle === p.handle}
                          onClick={() => void rerunRecruiter(p.handle)}
                        >
                          Recruiter search
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <AdminNewsletterComposer
          getToken={getToken}
          subscriberCount={subscriberCount}
          emailReady={emailReady}
        />

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Users ({users.length})</h2>
          {planError && <p className="mt-2 text-sm text-red-600">{planError}</p>}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Joined</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isPro = u.plan === "pro";
                  return (
                    <tr key={u.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <span className="font-medium">{u.name || "—"}</span>
                        {u.handle && (
                          <p className="font-mono text-xs text-muted">@{u.handle}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted">{u.email}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2 capitalize">
                          <span>{u.plan || "free"}</span>
                          {isPro && <Pill verified>Pro</Pill>}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted">{u.created_at}</td>
                      <td className="py-3">
                        <Button
                          variant={isPro ? "secondary" : "primary"}
                          className="px-3 py-1.5 text-xs"
                          disabled={updatingUserId === u.id}
                          onClick={() => void toggleUserPlan(u)}
                        >
                          {updatingUserId === u.id
                            ? "Saving…"
                            : isPro
                              ? "Remove Pro"
                              : "Set Pro"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted">
          {brand.name} admin · authorized admins only
        </p>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return (
    <div className={surfaces.cardPadded}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 ${typography.monoStat}`}>{safeValue.toLocaleString()}</p>
    </div>
  );
}
