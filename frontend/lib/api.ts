export type ScoreDimensions = {
  evidence_depth: number;
  consistency: number;
  peer_verification: number;
  impact_signals: number;
  trust_ratio?: number;
};

export type TrustScore = {
  overall: number;
  dimensions: ScoreDimensions;
  delta: number;
  updated_at: string;
  positive_signals?: string[];
  negative_signals?: string[];
};

export type Capability = {
  name: string;
  evidence_count: number;
  verified: boolean;
};

export type TimelineEvent = {
  id?: string;
  label: string;
  type: string;
  platform: string;
  verified: boolean;
  occurred_at: string;
};

export type ComparativeInsight = {
  dimension: string;
  percentile: number;
  message: string;
};

export type ActivityAlert = {
  type: string;
  message: string;
  delta?: number;
  created_at: string;
};

export type GitHubPreview = {
  github_username: string;
  handle: string;
  display_name: string;
  headline?: string;
  avatar_url?: string;
  trust_score: TrustScore;
  capabilities: Capability[];
  evidence_count: number;
  evidence_highlights: string[];
  stats?: ProfileStat[];
  social_links?: SocialLink[];
  github_public_email?: string;
  flagship_repo?: {
    name: string;
    url: string;
    stars: number;
  };
  is_shadow: boolean;
  is_claimed: boolean;
  passport_url: string;
  invite_url: string;
  github_url: string;
};

export type ProfileStat = {
  key: string;
  label: string;
  value: number;
  display: string;
  platform: string;
  category: string;
  url?: string;
  verified: boolean;
  detail?: string;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type ProfileInsight = {
  summary: string;
  highlights?: string[];
  role_signals?: string[];
  cross_platform_consistency?: string;
  gaps?: string[];
  source_urls?: string[];
  model?: string;
  generated_at: string;
};

export type RecruiterFinding = {
  title: string;
  url: string;
  snippet?: string;
  platform?: string;
};

export type RecruiterReport = {
  summary: string;
  highlights?: string[];
  role_signals?: string[];
  hiring_signals?: string[];
  red_flags?: string[];
  cross_platform_consistency?: string;
  gaps?: string[];
  web_findings?: RecruiterFinding[];
  source_urls?: string[];
  model?: string;
  score_before: number;
  score_after: number;
  score_delta: number;
  generated_at: string;
};

export type RecruiterEligibility = {
  eligible: boolean;
  reason?: string;
  user_cooldown_until?: string;
  profile_cooldown_until?: string;
  last_run_status?: string;
  active_run_id?: string;
};

export type RecruiterSearchRun = {
  id: string;
  profile_handle: string;
  status: string;
  error?: string;
  progress_percent?: number;
  progress_step?: string;
  live_findings?: RecruiterFinding[];
  score_before: number;
  score_after?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
};

export type PublicProfile = {
  handle: string;
  display_name: string;
  headline?: string;
  avatar_url?: string;
  trust_score: TrustScore;
  capabilities: Capability[];
  evidence?: Array<{
    type: string;
    title: string;
    platform: string;
    verified: boolean;
    count?: number;
    url?: string;
    occurred_at?: string;
  }>;
  evidence_count: number;
  timeline?: TimelineEvent[];
  insights?: ComparativeInsight[];
  active_since: string;
  is_shadow: boolean;
  is_claimed: boolean;
  view_mode: string;
  badge_markdown?: string;
  estimated_score_min?: number;
  estimated_score_max?: number;
  profile_completeness?: number;
  is_pro?: boolean;
  is_owner?: boolean;
  stats?: ProfileStat[];
  social_links?: SocialLink[];
  github_public_email?: string;
  ai_insight?: ProfileInsight;
  recruiter_report?: RecruiterReport;
};

export type Profile = PublicProfile & {
  id?: string;
  user_id?: string;
  onboarding_step: number;
  data_sources: Array<{
    platform: string;
    external_id: string;
    connected: boolean;
  }>;
  evidence: Array<{
    type: string;
    title: string;
    platform: string;
    verified: boolean;
    count?: number;
  }>;
  timeline?: TimelineEvent[];
};

export type User = {
  id: string;
  email: string;
  name: string;
  plan?: string;
  account_type?: "passport" | "recruiter" | "";
  professional_segment?: string;
  hiring_segment?: string;
  recruiter_onboarding_complete?: boolean;
  company_email?: string;
  email_digest_enabled?: boolean;
};

export type RecruiterCompany = {
  id: string;
  name: string;
  email?: string;
  linkedin_url?: string;
  website_url?: string;
  logo_url?: string;
  industry?: string;
  size?: string;
  description?: string;
  location?: string;
  employee_count?: string;
  scraped_at?: string;
};

export type MatchSignal = {
  category: string;
  label: string;
  detail: string;
  source?: string;
  url?: string;
  weight?: number;
};

export type CandidateSearchResult = {
  handle: string;
  display_name: string;
  headline?: string;
  avatar_url?: string;
  trust_score: TrustScore;
  capabilities?: Capability[];
  evidence_count: number;
  match_reason?: string;
  match_summary?: string;
  match_highlights?: string[];
  matched_signals?: MatchSignal[];
  relevance_score?: number;
  ai_summary?: string;
  is_shadow: boolean;
  discovery_source?: "indexed" | "web";
  starred?: boolean;
};

export type ParsedRecruiterQuery = {
  raw: string;
  skills?: string[];
  tools?: string[];
  location?: string;
  employers?: string[];
  require_employer: boolean;
};

export type RecruiterSearchFilters = {
  min_trust_score?: number;
  discovery_source?: "all" | "indexed" | "web";
  location?: string;
  skills?: string[];
  tools?: string[];
  employers?: string[];
  require_employer?: boolean;
  starred_only?: boolean;
};

export type RecruiterSearchMeta = {
  indexed_count: number;
  web_discovered_count: number;
  tavily_used: boolean;
  firecrawl_used: boolean;
  web_results_reviewed: number;
  parsed_query?: ParsedRecruiterQuery;
  filtered_out?: number;
};

export type RecruiterSavedCandidate = {
  handle: string;
  display_name: string;
  headline?: string;
  avatar_url?: string;
  trust_score: number;
  evidence_count: number;
  notes?: string;
  saved_from_query?: string;
  saved_at: string;
};

export type ScoreHistoryPoint = {
  overall: number;
  recorded_at: string;
};

export type AdminStats = {
  users: number;
  profiles: number;
  shadow_profiles: number;
  claimed_profiles: number;
  pro_users: number;
  private_profiles: number;
};

export type AdminProfileRow = {
  handle: string;
  display_name: string;
  trust_score: number;
  evidence_count: number;
  is_shadow: boolean;
  is_claimed: boolean;
  is_private: boolean;
  onboarding_step: number;
  has_user: boolean;
};

export type ClaimEligibility = {
  eligible: boolean;
  reason?: string;
  message?: string;
  required_github?: string;
  connected_github?: string;
  github_connected?: boolean;
  already_has_profile?: boolean;
};

export type ProfileDispute = {
  id: string;
  profile_handle: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
};

export type AdminDisputeRow = {
  id: string;
  profile_handle: string;
  reporter_email: string;
  reporter_name: string;
  reason: string;
  details: string;
  status: string;
  admin_note?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  plan: string;
  handle?: string;
  created_at: string;
};

export type AuthResponse = {
  token: string;
  user: User;
  profile?: Profile;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? authHeaders(token) : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as { error?: string }) : {};
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  subscribeNewsletter: (email: string, source = "footer") =>
    request<{ ok: boolean; created: boolean; message: string }>("/v1/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email, source }),
    }),
  contactSales: (body: {
    company_name: string;
    email: string;
    plan?: string;
    source?: string;
  }) =>
    request<{ ok: boolean; message: string }>("/v1/sales/contact", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: { email: string; password: string; name: string; handle: string }) =>
    request<AuthResponse>("/v1/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/v1/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: (token: string) =>
    request<{ user: User; profile?: Profile }>("/v1/me", undefined, token),
  listProfiles: () =>
    request<{ profiles: PublicProfile[]; total: number }>("/v1/profiles"),
  previewGitHub: (username: string) =>
    request<GitHubPreview>(`/v1/preview/github/${encodeURIComponent(username.trim().toLowerCase())}`),
  getProfile: (handle: string, token?: string) =>
    request<PublicProfile>(`/v1/profiles/${handle}`, undefined, token),
  getTrustScore: (handle: string, mode = "full") =>
    request<{ handle: string; trust_score: TrustScore }>(`/v1/trust-score?handle=${handle}&mode=${mode}`),
  connectGitHub: (token: string, username: string) =>
    request<Profile>("/v1/profiles/connect/github", {
      method: "POST",
      body: JSON.stringify({ username }),
    }, token),
  connectStackOverflow: (token: string, username: string) =>
    request<Profile>("/v1/profiles/connect/stackoverflow", {
      method: "POST",
      body: JSON.stringify({ username }),
    }, token),
  completeOnboarding: (token: string) =>
    request<Profile>("/v1/onboarding/complete", { method: "POST" }, token),
  claimEligibility: (token: string, handle: string) =>
    request<ClaimEligibility>(
      `/v1/profiles/${encodeURIComponent(handle)}/claim/eligibility`,
      undefined,
      token,
    ),
  claimProfile: (token: string, handle: string) =>
    request<Profile>(`/v1/profiles/${handle}/claim`, { method: "POST" }, token),
  createProfileDispute: (
    token: string,
    handle: string,
    body: { reason: string; details?: string },
  ) =>
    request<{ dispute: ProfileDispute; message: string; existing?: boolean }>(
      `/v1/profiles/${encodeURIComponent(handle)}/disputes`,
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  syncClerk: (token: string, handle?: string) =>
    request<{ user: User; profile?: Profile; plan?: string; shadow_handle?: string; bootstrap_message?: string }>(
      "/v1/auth/clerk/sync",
      { method: "POST", body: JSON.stringify(handle ? { handle } : {}) },
      token,
    ),
  getAlerts: (token: string) =>
    request<{ alerts: ActivityAlert[]; insights?: ComparativeInsight[]; insights_locked?: boolean }>(
      "/v1/me/alerts",
      undefined,
      token,
    ),
  invitePeer: (token: string, body: { verifier_email: string; skill_area: string; context?: string }) =>
    request<{ verification: { token: string }; confirm_url: string }>("/v1/verifications/invite", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),
  confirmPeer: (token: string) =>
    request<{ status: string; handle: string; message: string }>(`/v1/verifications/${token}/confirm`),
  connectDevpost: (token: string, username: string) =>
    request<Profile>("/v1/profiles/connect/devpost", {
      method: "POST",
      body: JSON.stringify({ username }),
    }, token),
  connectDevfolio: (token: string, profileUrl: string) =>
    request<Profile>("/v1/profiles/connect/devfolio", {
      method: "POST",
      body: JSON.stringify({ profile_url: profileUrl }),
    }, token),
  connectLinkedIn: (token: string, username?: string) =>
    request<Profile>("/v1/profiles/connect/linkedin", {
      method: "POST",
      body: JSON.stringify(username?.trim() ? { username: username.trim() } : {}),
    }, token),
  addManualClaim: (token: string, body: { type: string; title: string; url?: string }) =>
    request<Profile>("/v1/profiles/claims/manual", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),
  disconnectSource: (token: string, platform: string) =>
    request<{ profile: Profile; previous_score: number; new_score: number; score_delta: number }>(
      `/v1/profiles/sources/${platform}`,
      { method: "DELETE" },
      token,
    ),
  updateSettings: (token: string, body: Record<string, unknown>) =>
    request<Profile>("/v1/me/settings", { method: "PATCH", body: JSON.stringify(body) }, token),
  deleteAccount: (token: string) =>
    request<{ status: string }>("/v1/me", { method: "DELETE" }, token),
  scoreHistory: (token: string) =>
    request<{ history: ScoreHistoryPoint[] }>("/v1/me/score-history", undefined, token),
  createCheckout: (token: string) =>
    request<{ checkout_url: string }>("/v1/billing/checkout", { method: "POST" }, token),
  generateAPIKey: (token: string) =>
    request<{ api_key: string }>("/v1/me/api-key", { method: "POST" }, token),
  adminMe: (token: string) =>
    request<{ admin: boolean; github_username: string; email_configured?: boolean }>(
      "/v1/admin/me",
      undefined,
      token,
    ),
  adminStats: (token: string) => request<AdminStats>("/v1/admin/stats", undefined, token),
  adminProfiles: (token: string, offset = 0, limit = 50) =>
    request<{ profiles: AdminProfileRow[]; total: number; limit: number; offset: number }>(
      `/v1/admin/profiles?offset=${offset}&limit=${limit}`,
      undefined,
      token,
    ),
  adminUsers: (token: string, offset = 0, limit = 50) =>
    request<{ users: AdminUserRow[]; limit: number; offset: number }>(
      `/v1/admin/users?offset=${offset}&limit=${limit}`,
      undefined,
      token,
    ),
  adminSetUserPlan: (token: string, userId: string, plan: "pro" | "free") =>
    request<{ user: AdminUserRow }>(
      `/v1/admin/users/${encodeURIComponent(userId)}/plan`,
      { method: "PATCH", body: JSON.stringify({ plan }) },
      token,
    ),
  adminDisputes: (token: string, status = "open") =>
    request<{ disputes: AdminDisputeRow[]; open_count: number }>(
      `/v1/admin/disputes?status=${encodeURIComponent(status)}`,
      undefined,
      token,
    ),
  adminResolveDispute: (
    token: string,
    disputeId: string,
    body: { action: "dismiss" | "unclaim"; admin_note?: string },
  ) =>
    request<{ dispute: ProfileDispute; action: string }>(
      `/v1/admin/disputes/${encodeURIComponent(disputeId)}`,
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    ),
  adminRerunRecruiterSearch: (token: string, handle: string) =>
    request<{ run_id: string; status: string; handle: string; message: string }>(
      `/v1/admin/profiles/${encodeURIComponent(handle)}/recruiter-search`,
      { method: "POST" },
      token,
    ),
  adminRescrapeProfile: (token: string, handle: string) =>
    request<{ handle: string; message: string }>(
      `/v1/admin/profiles/${encodeURIComponent(handle)}/rescrape`,
      { method: "POST" },
      token,
    ),
  adminNewsletterSubscribers: (token: string) =>
    request<{
      subscribers: Array<{ email: string; source?: string; created_at: string }>;
      total: number;
      email_ready: boolean;
    }>("/v1/admin/newsletter/subscribers", undefined, token),
  adminPreviewNewsletter: (
    token: string,
    body: { subject: string; body_html: string; sample_email?: string },
  ) =>
    request<{ html: string; includes_signup_cta: boolean }>(
      "/v1/admin/newsletter/preview",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  adminSendNewsletter: (
    token: string,
    body: { subject: string; body_html: string; test_email?: string; send_to_all?: boolean },
  ) =>
    request<{ sent: number; failed?: number; failures?: string[]; mode: string }>(
      "/v1/admin/newsletter/send",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  embedUrl: (handle: string) => `${API_URL}/embed/${handle}`,
  badgeUrl: (handle: string) => `${API_URL}/badge/${handle}.svg`,
  recruiterEligibility: (handle: string, token: string) =>
    request<{ handle: string; eligibility: RecruiterEligibility }>(
      `/v1/profiles/${encodeURIComponent(handle)}/recruiter/eligibility`,
      undefined,
      token,
    ),
  startRecruiterSearch: (handle: string, token: string) =>
    request<{ run_id: string; status: string; handle: string; message: string }>(
      `/v1/profiles/${encodeURIComponent(handle)}/recruiter-search`,
      { method: "POST" },
      token,
    ),
  getRecruiterRun: (runId: string, token: string) =>
    request<{ run: RecruiterSearchRun; report?: RecruiterReport; trust_score?: TrustScore }>(
      `/v1/recruiter-runs/${encodeURIComponent(runId)}`,
      undefined,
      token,
    ),
  setAccountType: (token: string, accountType: "passport" | "recruiter") =>
    request<{ user: User }>("/v1/onboarding/account-type", {
      method: "POST",
      body: JSON.stringify({ account_type: accountType }),
    }, token),
  setProfessionalSegment: (token: string, segment: string) =>
    request<{ user: User; profile: Profile }>("/v1/onboarding/segment", {
      method: "POST",
      body: JSON.stringify({ segment }),
    }, token),
  lookupRecruiterCompany: (
    token: string,
    body: { name?: string; email?: string; linkedin_url?: string; website_url?: string },
  ) =>
    request<{ company: RecruiterCompany; cached: boolean }>(
      "/v1/recruiter/company/lookup",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  completeRecruiterOnboarding: (
    token: string,
    body: {
      name: string;
      email: string;
      linkedin_url?: string;
      website_url?: string;
      hiring_segment?: string;
    },
  ) =>
    request<{ user: User; company: RecruiterCompany }>(
      "/v1/recruiter/onboarding/complete",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  getRecruiterCompany: (token: string) =>
    request<{ company: RecruiterCompany | null }>("/v1/recruiter/company", undefined, token),
  refreshRecruiterCompany: (token: string) =>
    request<{ company: RecruiterCompany }>(
      "/v1/recruiter/company/refresh",
      { method: "POST" },
      token,
    ),
  recruiterCandidateSearch: (
    token: string,
    query: string,
    segment?: string,
    filters?: RecruiterSearchFilters,
  ) =>
    request<{ results: CandidateSearchResult[]; total: number; meta: RecruiterSearchMeta }>(
      "/v1/recruiter/search",
      { method: "POST", body: JSON.stringify({ query, segment, filters: filters ?? {} }) },
      token,
    ),
  listRecruiterSaved: (token: string) =>
    request<{ saved: RecruiterSavedCandidate[]; total: number }>("/v1/recruiter/saved", undefined, token),
  starRecruiterCandidate: (
    token: string,
    body: { handle: string; saved_from_query?: string; notes?: string },
  ) =>
    request<{ handle: string; starred: boolean }>(
      "/v1/recruiter/saved",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  unstarRecruiterCandidate: (token: string, handle: string) =>
    request<{ handle: string; starred: boolean }>(
      `/v1/recruiter/saved/${encodeURIComponent(handle)}`,
      { method: "DELETE" },
      token,
    ),
  setRecruiterHiringSegment: (token: string, segment: string) =>
    request<{ hiring_segment: string }>(
      "/v1/recruiter/hiring-segment",
      { method: "PATCH", body: JSON.stringify({ segment }) },
      token,
    ),
};
