"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { brand, routes } from "@/constants";
import { layout, states, surfaces, typography } from "@/constants/styles";
import { syncAccount } from "@/lib/sync-account";

export default function PassportPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(routes.signIn);
      return;
    }

    async function resolvePassport() {
      try {
        const result = await syncAccount(getToken);
        if (result.profile?.handle) {
          router.replace(routes.sampleProfile(result.profile.handle));
          return;
        }
        router.replace(routes.onboarding);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load your passport. Is the API running?",
        );
        setLoading(false);
      }
    }

    void resolvePassport();
  }, [isLoaded, isSignedIn, getToken, router]);

  if (!isLoaded || loading) {
    return <div className={states.loading}>Opening your Trust Passport…</div>;
  }

  return (
    <>
      <Navbar />
      <main className={`${layout.pageWithNavNarrow} text-center`}>
        <h1 className={typography.pageTitleLg}>Could not open your passport</h1>
        <p className={`mt-4 ${states.error}`}>{error}</p>
        <p className="mt-2 text-sm text-muted">
          Backend expected at {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}
        </p>
        <div className={`mt-8 ${surfaces.cardPadded} text-left`}>
          <p className="font-semibold">Your passport URL will look like:</p>
          <code className="mt-2 block font-mono text-sm text-muted">{brand.passportUrl("your-handle")}</code>
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button href={routes.onboarding} variant="secondary">
            Set up profile
          </Button>
        </div>
      </main>
    </>
  );
}
