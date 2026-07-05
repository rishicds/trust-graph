"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { surfaces, typography } from "@/constants/styles";
import { api } from "@/lib/api";

export function ProUpsellBanner({ embedded = false }: { embedded?: boolean }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  async function upgradePro() {
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.createCheckout(token);
      window.location.href = res.checkout_url;
    } finally {
      setLoading(false);
    }
  }

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? undefined : `mt-10 ${surfaces.cardPadded}`}>
      <h2 className="text-lg font-semibold">Unlock full timeline & insights</h2>
      <p className={`mt-2 ${typography.body}`}>
        Pro adds your complete trust timeline, comparative insights vs peers, score history, API keys,
        and webhooks for design partners.
      </p>
      <Button className="mt-4" onClick={upgradePro} disabled={loading}>
        {loading ? "Redirecting…" : "Upgrade to Pro — $15/mo"}
      </Button>
    </Wrapper>
  );
}
