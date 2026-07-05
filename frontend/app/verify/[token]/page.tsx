"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { routes } from "@/constants";
import { layout, states, surfaces, typography } from "@/constants/styles";
import { api } from "@/lib/api";

export default function VerifyPage() {
  const params = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [handle, setHandle] = useState("");

  useEffect(() => {
    async function confirm() {
      try {
        const res = await api.confirmPeer(params.token);
        setHandle(res.handle);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    }
    if (params.token) void confirm();
  }, [params.token]);

  return (
    <>
      <Navbar />
      <main className={layout.pageWithNavNarrow}>
        <div className={`${surfaces.cardPadded} text-center`}>
          {status === "loading" && <p className={states.loading}>Confirming verification...</p>}
          {status === "success" && (
            <>
              <h1 className={typography.pageTitle}>Verification confirmed</h1>
              <p className={`mt-3 ${typography.body}`}>
                Peer verification recorded for @{handle}. Their trust score will update shortly.
              </p>
              <Button href={routes.home} className="mt-6">
                Back to TrustGraph
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <h1 className={typography.pageTitle}>Verification failed</h1>
              <p className={`mt-3 ${typography.body}`}>
                This link may have expired or already been used.
              </p>
              <Button href={routes.home} className="mt-6">
                Back to TrustGraph
              </Button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
