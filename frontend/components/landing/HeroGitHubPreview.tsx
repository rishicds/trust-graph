"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileSocialLinks } from "@/components/profile/ProfileSocialLinks";
import { Button } from "@/components/ui/Button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { landing, routes } from "@/constants";
import { brand } from "@/constants/brand";
import { api, GitHubPreview } from "@/lib/api";
import { cn } from "@/lib/utils";

function trustSignals(preview: GitHubPreview): string[] {
  const signals: string[] = [];
  if (preview.evidence_highlights?.length) {
    signals.push(...preview.evidence_highlights.slice(0, 3));
  }
  if (preview.stats?.length) {
    for (const stat of preview.stats.slice(0, 2)) {
      if (stat.verified) {
        signals.push(`${stat.display} ${stat.label.toLowerCase()}`);
      }
    }
  }
  if (preview.evidence_count > 0) {
    signals.push(`${preview.evidence_count} public evidence items indexed`);
  }
  if (preview.is_claimed) {
    signals.push("Verified identity — profile claimed");
  } else if (preview.is_shadow) {
    signals.push("Public GitHub evidence — claimable passport");
  }
  return [...new Set(signals)].slice(0, 4);
}

export function HeroGitHubPreview() {
  const { hero } = landing;
  const { lookup } = hero;
  const defaultHandle = hero.defaultPreviewHandle ?? "rishicds";

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<GitHubPreview | null>(null);
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState<string>(hero.searchPlaceholderMobile);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () =>
      setSearchPlaceholder(mq.matches ? hero.searchPlaceholder : hero.searchPlaceholderMobile);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [hero.searchPlaceholder, hero.searchPlaceholderMobile]);

  useEffect(() => {
    async function loadSample() {
      try {
        const sample = await api.previewGitHub(defaultHandle);
        setPreview(sample);
      } catch {
        // leave empty until user searches
      } finally {
        setBootLoading(false);
      }
    }
    void loadSample();
  }, [defaultHandle]);

  async function handleLookup(e?: FormEvent) {
    e?.preventDefault();
    const query = username.trim();
    if (!query) return;

    setLoading(true);
    setError("");
    try {
      const result = await api.previewGitHub(query);
      setPreview(result);
    } catch {
      setError(lookup.error);
    } finally {
      setLoading(false);
    }
  }

  function copyInvite() {
    if (!preview) return;
    void navigator.clipboard.writeText(preview.invite_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function mailInvite() {
    if (!preview) return;
    const subject = encodeURIComponent(lookup.inviteEmailSubject(preview.display_name));
    const body = encodeURIComponent(
      lookup.inviteEmailBody(
        preview.display_name,
        Math.round(preview.trust_score.overall),
        preview.invite_url,
      ),
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  const signals = preview ? trustSignals(preview) : [];
  const showInvite = preview && !loading && !bootLoading;

  return (
    <div className="mx-auto w-full min-w-0 text-left">
      <form onSubmit={handleLookup} className="relative z-30 w-full min-w-0">
        <div
          className={cn(
            "hero-search-input flex h-14 min-w-0 items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white py-2 pl-3 pr-2 transition sm:h-[72px] sm:gap-3 sm:pl-5 md:h-[88px] md:pl-6 md:pr-3",
            focused && "border-teal",
          )}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <Search className="h-5 w-5 shrink-0 text-[#6B7280]" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label={lookup.searchAria}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9CA3AF] sm:text-base md:text-lg"
            placeholder={searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal text-white shadow-[0_4px_14px_rgba(15,118,110,0.35)] transition md:h-14 md:w-14 md:rounded-2xl",
              "hover:bg-[#0d6b64] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
            )}
            aria-label={lookup.button}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

      {loading && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#6B7280]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {lookup.loading}
        </p>
      )}

      {(bootLoading || (preview && !loading)) && (
        <div
          className={cn(
            "hero-search-card relative z-10 mt-5 overflow-hidden rounded-2xl p-5 md:p-6",
            !bootLoading && preview && "score-animate",
          )}
        >
          {bootLoading ? (
            <div className="flex items-center gap-3 py-6 text-sm text-[#6B7280]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading live trust preview…
            </div>
          ) : preview ? (
            <>
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal">
                <ShieldCheck className="h-3.5 w-3.5" />
                Live trust preview
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <ProfileAvatar
                    handle={preview.handle}
                    displayName={preview.display_name}
                    avatarUrl={preview.avatar_url}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                      GitHub
                    </p>
                    <p className="truncate text-lg font-semibold text-[#0A0A0A]">
                      {preview.display_name}
                    </p>
                    <p className="truncate font-mono text-sm text-[#6B7280]">
                      @{preview.github_username}
                    </p>
                    {(preview.social_links?.length || preview.github_public_email) && (
                      <ProfileSocialLinks
                        links={preview.social_links}
                        githubEmail={preview.github_public_email}
                        compact
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>

                <div className="shrink-0 rounded-xl border border-teal/15 bg-teal-light px-5 py-3 text-center sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-teal">
                    Trust score
                  </p>
                  <p className="text-4xl font-extrabold tabular-nums text-[#0A0A0A] md:text-5xl">
                    <NumberTicker value={preview.trust_score.overall} />
                  </p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">{lookup.fromEvidence}</p>
                </div>
              </div>

              {signals.length > 0 && (
                <ul className="mt-5 space-y-2.5 border-t border-[#F0F0F0] pt-5">
                  {signals.map((signal) => (
                    <li key={signal} className="flex items-start gap-2.5 text-sm text-[#374151]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" strokeWidth={2.5} />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              )}

              {preview.trust_score.dimensions && (
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#F0F0F0] pt-5 md:grid-cols-4">
                  {[
                    { label: "Evidence", value: preview.trust_score.dimensions.evidence_depth },
                    { label: "Consistency", value: preview.trust_score.dimensions.consistency },
                    { label: "Impact", value: preview.trust_score.dimensions.impact_signals },
                    { label: "Peer", value: preview.trust_score.dimensions.peer_verification },
                  ].map((dim) => (
                    <div key={dim.label}>
                      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-[#6B7280]">
                        <span>{dim.label}</span>
                        <span className="font-mono tabular-nums text-[#0A0A0A]">
                          {dim.value.toFixed(0)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                        <div
                          className="h-full rounded-full bg-teal transition-all duration-700"
                          style={{ width: `${Math.min(100, dim.value)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showInvite && !preview.is_claimed && (
                <div className="mt-5 flex flex-col gap-3 border-t border-[#F0F0F0] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2">
                    <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    <div>
                      <p className="text-sm font-medium">{lookup.inviteTitle(preview.display_name)}</p>
                      <p className="text-xs text-[#6B7280]">{lookup.inviteBody}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" className="text-xs" onClick={copyInvite}>
                      {copied ? lookup.copied : lookup.copyInvite}
                    </Button>
                    <Button type="button" variant="ghost" className="text-xs" onClick={mailInvite}>
                      <Send className="mr-1 h-3 w-3" />
                      {lookup.sendInvite}
                    </Button>
                  </div>
                </div>
              )}

              <p className="mt-4 text-center font-mono text-xs text-[#9CA3AF]">
                {brand.passportUrl(preview.handle)} ·{" "}
                <Link href={routes.sampleProfile(preview.handle)} className="text-teal hover:underline">
                  {lookup.viewPassport}
                </Link>
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
