"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/Button";
import { dashboard, errors, onboarding, routes } from "@/constants";
import { surfaces, states } from "@/constants/styles";
import { api, Profile } from "@/lib/api";

type ConnectedSourcesPanelProps = {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
};

type PlatformId = "github" | "linkedin" | "stackoverflow" | "devpost" | "devfolio";

const PLATFORMS: Array<{
  id: PlatformId;
  label: string;
  placeholder?: string;
}> = [
  { id: "github", label: "GitHub", placeholder: onboarding.github.placeholder },
  { id: "linkedin", label: "LinkedIn" },
  { id: "stackoverflow", label: "Stack Overflow", placeholder: onboarding.stackoverflow.placeholder },
  { id: "devpost", label: "Devpost", placeholder: onboarding.devpost.placeholder },
  { id: "devfolio", label: "Devfolio", placeholder: onboarding.devfolio.placeholder },
];

function sourceFor(profile: Profile, platform: PlatformId) {
  return profile.data_sources?.find((s) => s.platform === platform);
}

export function ConnectedSourcesPanel({ profile, onProfileUpdate }: ConnectedSourcesPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { user } = useUser();
  const linkedInSynced = useRef(false);

  const [githubUsername, setGithubUsername] = useState(
    () => sourceFor(profile, "github")?.external_id ?? "",
  );
  const [soUsername, setSoUsername] = useState(
    () => sourceFor(profile, "stackoverflow")?.external_id ?? "",
  );
  const [devpostUsername, setDevpostUsername] = useState(
    () => sourceFor(profile, "devpost")?.external_id ?? "",
  );
  const [devfolioUrl, setDevfolioUrl] = useState(
    () => sourceFor(profile, "devfolio")?.external_id ?? "",
  );
  const [linkedinSlug, setLinkedinSlug] = useState("");
  const [connecting, setConnecting] = useState<PlatformId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const linked = searchParams.get("linked");
    if (linked !== "linkedin" || linkedInSynced.current) return;
    linkedInSynced.current = true;

    void (async () => {
      const token = await getToken();
      if (!token) return;
      setConnecting("linkedin");
      setError("");
      try {
        await user?.reload();
        const updated = await api.connectLinkedIn(token, linkedinSlug.trim() || undefined);
        onProfileUpdate(updated);
        router.replace(routes.dashboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : errors.linkedinConnectFailed);
      } finally {
        setConnecting(null);
      }
    })();
  }, [searchParams, getToken, onProfileUpdate, router, user, linkedinSlug]);

  async function runConnect(platform: PlatformId, action: () => Promise<Profile>) {
    setConnecting(platform);
    setError("");
    try {
      const updated = await action();
      onProfileUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : dashboard.sources.connectFailed);
    } finally {
      setConnecting(null);
    }
  }

  async function connectGitHub() {
    const token = await getToken();
    if (!token || !githubUsername.trim()) return;
    await runConnect("github", () => api.connectGitHub(token, githubUsername.trim()));
  }

  async function connectStackOverflow() {
    const token = await getToken();
    if (!token || !soUsername.trim()) return;
    await runConnect("stackoverflow", () => api.connectStackOverflow(token, soUsername.trim()));
  }

  async function connectDevpost() {
    const token = await getToken();
    if (!token || !devpostUsername.trim()) return;
    await runConnect("devpost", () => api.connectDevpost(token, devpostUsername.trim()));
  }

  async function connectDevfolio() {
    const token = await getToken();
    if (!token || !devfolioUrl.trim()) return;
    await runConnect("devfolio", () => api.connectDevfolio(token, devfolioUrl.trim()));
  }

  async function syncLinkedIn() {
    const token = await getToken();
    if (!token) return;
    await user?.reload();
    await runConnect("linkedin", () => api.connectLinkedIn(token, linkedinSlug.trim() || undefined));
  }

  async function startLinkedInOAuth() {
    if (!user) return;
    const redirectUrl = `${window.location.origin}${routes.dashboard}?linked=linkedin`;
    try {
      const res = await user.createExternalAccount({
        strategy: "oauth_linkedin_oidc",
        redirectUrl,
      });
      const url = res.verification?.externalVerificationRedirectURL;
      if (url) window.location.href = url.toString();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start LinkedIn sign-in — try again or sync after linking in your account.",
      );
    }
  }

  function renderConnectForm(platform: PlatformId) {
    switch (platform) {
      case "github":
        return (
          <div className="mt-2 flex gap-2">
            <input
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder={onboarding.github.placeholder}
              className={`min-w-0 flex-1 ${surfaces.inputInline}`}
            />
            <Button
              onClick={() => void connectGitHub()}
              disabled={connecting !== null || !githubUsername.trim()}
              className="shrink-0"
            >
              {connecting === "github" ? onboarding.github.connecting : onboarding.github.connect}
            </Button>
          </div>
        );
      case "stackoverflow":
        return (
          <div className="mt-2 flex gap-2">
            <input
              value={soUsername}
              onChange={(e) => setSoUsername(e.target.value)}
              placeholder={onboarding.stackoverflow.placeholder}
              className={`min-w-0 flex-1 ${surfaces.inputInline}`}
            />
            <Button
              onClick={() => void connectStackOverflow()}
              disabled={connecting !== null || !soUsername.trim()}
              className="shrink-0"
            >
              {connecting === "stackoverflow"
                ? onboarding.stackoverflow.connecting
                : onboarding.stackoverflow.connect}
            </Button>
          </div>
        );
      case "devpost":
        return (
          <div className="mt-2 flex gap-2">
            <input
              value={devpostUsername}
              onChange={(e) => setDevpostUsername(e.target.value)}
              placeholder={onboarding.devpost.placeholder}
              className={`min-w-0 flex-1 ${surfaces.inputInline}`}
            />
            <Button
              onClick={() => void connectDevpost()}
              disabled={connecting !== null || !devpostUsername.trim()}
              className="shrink-0"
            >
              {connecting === "devpost" ? onboarding.devpost.connecting : onboarding.devpost.connect}
            </Button>
          </div>
        );
      case "devfolio":
        return (
          <div className="mt-2 flex gap-2">
            <input
              value={devfolioUrl}
              onChange={(e) => setDevfolioUrl(e.target.value)}
              placeholder={onboarding.devfolio.placeholder}
              className={`min-w-0 flex-1 ${surfaces.inputInline}`}
            />
            <Button
              onClick={() => void connectDevfolio()}
              disabled={connecting !== null || !devfolioUrl.trim()}
              className="shrink-0"
            >
              {connecting === "devfolio" ? onboarding.devfolio.connecting : onboarding.devfolio.connect}
            </Button>
          </div>
        );
      case "linkedin":
        return (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <input
                value={linkedinSlug}
                onChange={(e) => setLinkedinSlug(e.target.value)}
                placeholder={onboarding.linkedin.slugPlaceholder}
                className={`min-w-0 flex-1 ${surfaces.inputInline}`}
                aria-label="LinkedIn profile slug"
              />
              <Button
                variant="secondary"
                onClick={() => void syncLinkedIn()}
                disabled={connecting !== null}
                className="shrink-0"
              >
                {connecting === "linkedin" ? onboarding.linkedin.syncing : onboarding.linkedin.sync}
              </Button>
            </div>
            <p className="text-xs text-muted">{onboarding.linkedin.slugHint}</p>
            <Button onClick={() => void startLinkedInOAuth()} disabled={connecting !== null || !user}>
              {connecting === "linkedin"
                ? onboarding.linkedin.connecting
                : onboarding.linkedin.connect}
            </Button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className={surfaces.cardPadded}>
      <h2 className="font-semibold">{dashboard.sources.title}</h2>
      <p className="mt-1 text-sm text-muted">{dashboard.sources.description}</p>

      <ul className="mt-4 space-y-4">
        {PLATFORMS.map((platform) => {
          const source = sourceFor(profile, platform.id);
          const connected = Boolean(source?.connected);

          return (
            <li key={platform.id} className="rounded-[12px] border border-border px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{platform.label}</p>
                  {connected && source?.external_id ? (
                    <p className="mt-0.5 truncate font-mono text-xs text-muted">@{source.external_id}</p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    connected ? "text-teal" : "text-muted"
                  }`}
                >
                  {connected ? dashboard.sources.connected : dashboard.sources.pending}
                </span>
              </div>
              {!connected ? renderConnectForm(platform.id) : null}
            </li>
          );
        })}
      </ul>

      {error ? <p className={`mt-3 text-sm ${states.error}`}>{error}</p> : null}

      <Button href={`${routes.onboarding}?step=2`} variant="ghost" className="mt-4 w-full">
        {dashboard.sources.moreSources}
      </Button>
    </div>
  );
}
