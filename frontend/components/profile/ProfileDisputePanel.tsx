"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";

import { BentoBlock } from "@/components/profile/ProfileBento";
import { Button } from "@/components/ui/Button";
import { profile as profileCopy, routes } from "@/constants";
import { surfaces } from "@/constants/styles";
import { api } from "@/lib/api";

const REASONS = [
  { id: "wrong_owner", label: "Someone else claimed my profile" },
  { id: "impersonation", label: "Impersonation or identity theft" },
  { id: "github_mismatch", label: "GitHub account does not match the real owner" },
  { id: "other", label: "Other" },
] as const;

export function ProfileDisputePanel({
  handle,
  isClaimed,
  isOwner,
}: {
  handle: string;
  isClaimed: boolean;
  isOwner: boolean;
}) {
  const { isSignedIn, getToken } = useAuth();
  const [reason, setReason] = useState<string>(REASONS[0].label);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isClaimed || isOwner) return null;

  async function submitDispute() {
    const token = await getToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.createProfileDispute(token, handle, {
        reason,
        details: details.trim(),
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit dispute");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BentoBlock className="col-span-12 border-amber-200/60 bg-[#FFFBF5]">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {profileCopy.dispute.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{profileCopy.dispute.subtitle}</p>

          {!isSignedIn ? (
            <p className="mt-4 text-sm">
              <a href={routes.signIn} className="font-medium text-teal hover:underline">
                {profileCopy.dispute.signInCta}
              </a>
            </p>
          ) : message ? (
            <p className="mt-4 text-sm font-medium text-teal">{message}</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted">
                  {profileCopy.dispute.reasonLabel}
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`mt-2 ${surfaces.input}`}
                >
                  {REASONS.map((r) => (
                    <option key={r.id} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted">
                  {profileCopy.dispute.detailsLabel}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={profileCopy.dispute.detailsPlaceholder}
                  rows={3}
                  className={`mt-2 ${surfaces.input} resize-y`}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button onClick={() => void submitDispute()} disabled={submitting}>
                {submitting ? profileCopy.dispute.submitting : profileCopy.dispute.submit}
              </Button>
            </div>
          )}
        </div>
      </div>
    </BentoBlock>
  );
}
