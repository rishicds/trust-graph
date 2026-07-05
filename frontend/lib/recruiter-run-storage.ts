const STORAGE_PREFIX = "trustgraph:recruiter-run:";

export function getStoredRecruiterRun(handle: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${STORAGE_PREFIX}${handle}`);
}

export function saveStoredRecruiterRun(handle: string, runId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${handle}`, runId);
}

export function clearStoredRecruiterRun(handle: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${STORAGE_PREFIX}${handle}`);
}
