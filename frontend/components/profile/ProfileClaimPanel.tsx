"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { profile as profileCopy, routes } from "@/constants";
import { api, ClaimEligibility } from "@/lib/api";

export function ProfileClaimPanel({ handle }: { handle: string }) {
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [eligibility, setEligibility] = useState<ClaimEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setEligibility(null);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await api.claimEligibility(token, handle);
        if (!cancelled) setEligibility(res);
      } catch {
        if (!cancelled) setEligibility(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken, handle]);

  async function claim() {
    const token = await getToken();
    if (!token) return;
    setClaiming(true);
    setError(null);
    try {
      await api.claimProfile(token, handle);
      router.push(routes.onboarding);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim profile");
    } finally {
      setClaiming(false);
    }
  }

  if (!isSignedIn) {
    return (
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href={routes.claimSignup(handle)}>{profileCopy.shadowClaim.cta}</Button>
        <Button href={routes.signIn} variant="ghost">
          {profileCopy.teaser.signInCta}
        </Button>
        <p className="w-full text-xs text-muted">
          {profileCopy.shadowClaim.verifyNote.replace("@handle", `@${handle}`)}
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="mt-6 text-sm text-muted">{profileCopy.shadowClaim.checking}</p>;
  }

  if (eligibility?.eligible) {
    return (
      <div className="mt-6">
        <Button onClick={() => void claim()} disabled={claiming}>
          {claiming ? profileCopy.shadowClaim.claiming : profileCopy.shadowClaim.cta}
        </Button>
        <p className="mt-2 text-xs text-teal">
          {profileCopy.shadowClaim.verifiedPrefix}
          {eligibility.connected_github ?? handle}
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-muted">
        {eligibility?.message ?? profileCopy.shadowClaim.verifyNote}
      </p>
      {eligibility?.reason === "github_not_connected" && (
        <Button href={routes.settings} variant="secondary">
          {profileCopy.shadowClaim.connectGitHub}
        </Button>
      )}
      {eligibility?.reason === "already_has_profile" && (
        <Button href={routes.dashboard} variant="ghost">
          {profileCopy.authenticated.viewYourProfile}
        </Button>
      )}
    </div>
  );
}
