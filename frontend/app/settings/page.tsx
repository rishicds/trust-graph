"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { routes } from "@/constants";
import { layout, states, surfaces, typography } from "@/constants/styles";
import { api, Profile } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [publicBreakdown, setPublicBreakdown] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [webhookURL, setWebhookURL] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(routes.signIn);
      return;
    }
    async function load() {
      const token = await getToken();
      if (!token) return;
      const res = await api.me(token);
      if (res.profile) {
        const p = res.profile as Profile;
        setProfile(p);
        setIsPrivate(Boolean((p as Profile & { is_private?: boolean }).is_private));
        setPublicBreakdown(Boolean((p as Profile & { public_breakdown?: boolean }).public_breakdown));
        setWebhookURL((p as Profile & { webhook_url?: string }).webhook_url ?? "");
      }
      setPlan((res as { plan?: string }).plan ?? "free");
      setLoading(false);
    }
    void load();
  }, [isLoaded, isSignedIn, getToken, router]);

  async function saveSettings() {
    const token = await getToken();
    if (!token) return;
    const updated = await api.updateSettings(token, {
      is_private: isPrivate,
      public_breakdown: publicBreakdown,
      webhook_url: webhookURL,
      email_digest_enabled: digestEnabled,
    });
    setProfile(updated);
  }

  async function upgradePro() {
    const token = await getToken();
    if (!token) return;
    const res = await api.createCheckout(token);
    window.location.href = res.checkout_url;
  }

  async function createAPIKey() {
    const token = await getToken();
    if (!token) return;
    const res = await api.generateAPIKey(token);
    setApiKey(res.api_key);
  }

  async function deleteAccount() {
    const token = await getToken();
    if (!token || !confirm("Delete your TrustGraph account and profile permanently?")) return;
    await api.deleteAccount(token);
    await signOut();
    router.push(routes.home);
  }

  if (!isLoaded || loading) {
    return <div className={states.loading}>Loading settings...</div>;
  }

  return (
    <>
      <Navbar />
      <main className={layout.pageWithNavNarrow}>
        <h1 className={typography.pageTitle}>Settings</h1>
        <p className="mt-2 text-muted">Privacy, billing, and integrations.</p>

        <div className="mt-8 space-y-6">
          <section className={surfaces.cardPadded}>
            <h2 className="font-semibold">Plan</h2>
            <p className="mt-2 text-sm text-muted">Current plan: {plan}</p>
            {plan !== "pro" ? (
              <Button className="mt-4" onClick={upgradePro}>Upgrade to Pro — $15/mo</Button>
            ) : (
              <p className="mt-4 text-sm text-teal">Pro active — score history, API keys, full insights</p>
            )}
          </section>

          <section className={surfaces.cardPadded}>
            <h2 className="font-semibold">Privacy</h2>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              Private mode (profile link returns 404 to others)
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={publicBreakdown} onChange={(e) => setPublicBreakdown(e.target.checked)} />
              Allow logged-in viewers to see full score breakdown
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={digestEnabled} onChange={(e) => setDigestEnabled(e.target.checked)} />
              Weekly digest email
            </label>
            <Button className="mt-4" variant="secondary" onClick={saveSettings}>Save privacy settings</Button>
          </section>

          {plan === "pro" && (
            <section className={surfaces.cardPadded}>
              <h2 className="font-semibold">Developer API</h2>
              <p className="mt-2 text-sm text-muted">Use X-API-Key header on /v1/trust-score</p>
              <Button className="mt-4" onClick={createAPIKey}>Generate API key</Button>
              {apiKey && <code className={`mt-3 block ${surfaces.codeBlock}`}>{apiKey}</code>}
              <input
                value={webhookURL}
                onChange={(e) => setWebhookURL(e.target.value)}
                placeholder="Webhook URL for score changes >5 pts"
                className={`mt-4 w-full ${surfaces.inputInline}`}
              />
            </section>
          )}

          {profile && (
            <section className={surfaces.cardPadded}>
              <h2 className="font-semibold">Disconnect sources</h2>
              <p className="mt-2 text-sm text-muted">Shows score impact before removal.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.data_sources?.map((s) => (
                  <Button
                    key={s.platform}
                    variant="ghost"
                    onClick={async () => {
                      const token = await getToken();
                      if (!token) return;
                      const res = await api.disconnectSource(token, s.platform);
                      alert(`Score changed by ${res.score_delta.toFixed(1)} points`);
                      setProfile(res.profile);
                    }}
                  >
                    Disconnect {s.platform}
                  </Button>
                ))}
              </div>
            </section>
          )}

          <section className={surfaces.cardPadded}>
            <h2 className="font-semibold text-red-600">Danger zone</h2>
            <Button variant="secondary" className="mt-4" onClick={deleteAccount}>
              Delete account (GDPR erasure)
            </Button>
          </section>
        </div>
      </main>
    </>
  );
}
