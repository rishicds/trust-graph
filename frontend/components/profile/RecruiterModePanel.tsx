"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { ProfileRecruiterReport } from "@/components/profile/ProfileRecruiterReport";
import { RecruiterSearchProgress } from "@/components/profile/RecruiterSearchProgress";
import { Button } from "@/components/ui/Button";
import { profile as profileCopy } from "@/constants";
import {
  api,
  PublicProfile,
  RecruiterEligibility,
  RecruiterFinding,
  RecruiterReport,
  RecruiterSearchRun,
  TrustScore,
} from "@/lib/api";
import {
  clearStoredRecruiterRun,
  getStoredRecruiterRun,
  saveStoredRecruiterRun,
} from "@/lib/recruiter-run-storage";

type RecruiterModePanelProps = {
  handle: string;
  profile: PublicProfile;
  onProfileUpdate: (next: PublicProfile) => void;
  embedded?: boolean;
};

function formatCooldown(until?: string) {
  if (!until) return "";
  const date = new Date(until);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecruiterModePanel({
  handle,
  profile,
  onProfileUpdate,
  embedded = false,
}: RecruiterModePanelProps) {
  const { getToken } = useAuth();
  const [eligibility, setEligibility] = useState<RecruiterEligibility | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState<string | undefined>();
  const [liveFindings, setLiveFindings] = useState<RecruiterFinding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [backgroundNotice, setBackgroundNotice] = useState<string | null>(null);
  const [report, setReport] = useState<RecruiterReport | undefined>(profile.recruiter_report);
  const pollCancelledRef = useRef(false);
  const trackingRunIdRef = useRef<string | null>(null);

  const loadEligibility = useCallback(async () => {
    setLoadingEligibility(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await api.recruiterEligibility(handle, token);
      setEligibility(res.eligibility);
    } catch {
      setEligibility({ eligible: false, reason: "Could not check recruiter mode" });
    } finally {
      setLoadingEligibility(false);
    }
  }, [getToken, handle]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  useEffect(() => {
    setReport(profile.recruiter_report);
  }, [profile.recruiter_report]);

  useEffect(() => {
    pollCancelledRef.current = false;
    return () => {
      pollCancelledRef.current = true;
    };
  }, []);

  function applyRunProgress(run: RecruiterSearchRun) {
    setRunStatus(run.status);
    if (typeof run.progress_percent === "number") {
      setProgressPercent(run.progress_percent);
    }
    if (run.progress_step) {
      setProgressStep(run.progress_step);
    }
    if (run.live_findings?.length) {
      setLiveFindings(run.live_findings);
    }
  }

  function applyCompletedRun(
    nextReport: RecruiterReport,
    trustScore?: TrustScore,
    notice?: string,
  ) {
    setReport(nextReport);
    if (trustScore) {
      onProfileUpdate({
        ...profile,
        recruiter_report: nextReport,
        trust_score: trustScore,
        ai_insight: {
          summary: nextReport.summary,
          highlights: nextReport.highlights,
          role_signals: nextReport.role_signals,
          cross_platform_consistency: nextReport.cross_platform_consistency,
          gaps: nextReport.gaps,
          source_urls: nextReport.source_urls,
          model: nextReport.model,
          generated_at: nextReport.generated_at,
        },
      });
    }
    finishTracking();
    setBackgroundNotice(notice ?? null);
    void loadEligibility();
  }

  function finishTracking() {
    trackingRunIdRef.current = null;
    clearStoredRecruiterRun(handle);
    setRunning(false);
  }

  async function pollRun(activeRunId: string) {
    const maxAttempts = 200;
    for (let i = 0; i < maxAttempts; i++) {
      if (pollCancelledRef.current) return;

      const token = await getToken();
      if (!token) {
        if (!pollCancelledRef.current) {
          setError("Session expired — sign in again");
          finishTracking();
        }
        return;
      }

      try {
        const res = await api.getRecruiterRun(activeRunId, token);
        if (pollCancelledRef.current) return;

        applyRunProgress(res.run);
        if (res.run.status === "completed" && res.report) {
          applyCompletedRun(res.report, res.trust_score as TrustScore | undefined);
          return;
        }
        if (res.run.status === "failed") {
          setError(res.run.error || "Recruiter search failed");
          finishTracking();
          void loadEligibility();
          return;
        }
      } catch (e) {
        if (pollCancelledRef.current) return;
        setError(e instanceof Error ? e.message : "Could not check search status");
        finishTracking();
        return;
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    if (!pollCancelledRef.current) {
      finishTracking();
      setBackgroundNotice(profileCopy.recruiter.backgroundHint);
      void loadEligibility();
    }
  }

  function beginTracking(activeRunId: string, status = "queued", reset = true) {
    if (trackingRunIdRef.current === activeRunId) return;

    trackingRunIdRef.current = activeRunId;
    saveStoredRecruiterRun(handle, activeRunId);
    pollCancelledRef.current = false;
    setRunning(true);
    setRunStatus(status);
    setBackgroundNotice(null);
    setError(null);
    if (reset) {
      setProgressPercent(status === "queued" ? 3 : 0);
      setProgressStep(undefined);
      setLiveFindings([]);
    }
    void pollRun(activeRunId);
  }

  const resumeBackgroundRun = useCallback(
    async (activeRunId: string, status?: string) => {
      if (trackingRunIdRef.current === activeRunId || running) return;

      const token = await getToken();
      if (!token) return;

      try {
        const res = await api.getRecruiterRun(activeRunId, token);
        if (res.run.status === "completed" && res.report) {
          applyCompletedRun(
            res.report,
            res.trust_score as TrustScore | undefined,
            profileCopy.recruiter.completedWhileAway,
          );
          return;
        }
        if (res.run.status === "failed") {
          clearStoredRecruiterRun(handle);
          setError(res.run.error || "Recruiter search failed");
          void loadEligibility();
          return;
        }
        beginTracking(activeRunId, status ?? res.run.status, false);
      } catch {
        clearStoredRecruiterRun(handle);
      }
    },
    [getToken, handle, running, profile, onProfileUpdate, loadEligibility],
  );

  useEffect(() => {
    if (running || loadingEligibility || report) return;

    const activeRunId =
      eligibility?.active_run_id ??
      getStoredRecruiterRun(handle) ??
      null;
    if (!activeRunId) return;

    const status = eligibility?.last_run_status;
    if (
      status === "queued" ||
      status === "running" ||
      (!status && getStoredRecruiterRun(handle))
    ) {
      void resumeBackgroundRun(activeRunId, status);
    }
  }, [
    eligibility?.active_run_id,
    eligibility?.last_run_status,
    handle,
    loadingEligibility,
    report,
    resumeBackgroundRun,
    running,
  ]);

  async function handleRun() {
    setError(null);
    setBackgroundNotice(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in required");
      const res = await api.startRecruiterSearch(handle, token);
      beginTracking(res.run_id, res.status);
    } catch (e) {
      finishTracking();
      setError(e instanceof Error ? e.message : "Could not start recruiter search");
      void loadEligibility();
    }
  }

  if (profile.is_owner) {
    return null;
  }

  const cooldownUntil =
    eligibility?.user_cooldown_until || eligibility?.profile_cooldown_until;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? undefined : "mt-10 border-t border-border pt-10"}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {profileCopy.recruiter.title}
      </h2>
      <p className="mt-2 text-sm text-muted">{profileCopy.recruiter.subtitle}</p>

      {!report && !running && eligibility?.eligible && !loadingEligibility && (
        <Button className="mt-4" onClick={() => void handleRun()} disabled={running}>
          {profileCopy.recruiter.run}
        </Button>
      )}

      {running && (
        <RecruiterSearchProgress
          status={runStatus ?? "queued"}
          progressPercent={progressPercent}
          progressStep={progressStep}
          liveFindings={liveFindings}
          backgroundHint={profileCopy.recruiter.backgroundHint}
        />
      )}

      {backgroundNotice && !running && (
        <p className="mt-3 text-sm text-teal">{backgroundNotice}</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!running && eligibility && !eligibility.eligible && eligibility.reason && !report && (
        <p className="mt-3 text-sm text-muted">
          {eligibility.reason}
          {cooldownUntil && <> {formatCooldown(cooldownUntil)}</>}
        </p>
      )}

      {report && <ProfileRecruiterReport report={report} embedded nested />}
    </Wrapper>
  );
}
