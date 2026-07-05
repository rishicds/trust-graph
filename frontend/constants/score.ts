import { scoreLabels } from "./messaging";

export type ScoreDimensionKey =
  | "evidence_depth"
  | "consistency"
  | "peer_verification"
  | "impact_signals";

export type ScoreDimensionMeta = {
  key: ScoreDimensionKey;
  label: string;
  weight: string;
  /** One line under the bar on profiles */
  summary: string;
  /** Full paragraph for onboarding / recruiter */
  description: string;
  /** What inputs move this dimension */
  signals: readonly string[];
};

export const scoreDimensionMeta: ScoreDimensionMeta[] = [
  {
    key: "evidence_depth",
    label: scoreLabels.evidenceDepth,
    weight: "35%",
    summary: "Volume of verifiable public work we can link to proof.",
    description:
      "Measures how much of a candidate's work is backed by indexed, linkable evidence — not self-reported skills. GitHub repos and merged PRs, Stack Overflow answers, Devpost projects, talks, and portfolio corroboration all count. OAuth-connected sources score higher than shadow-only data, and recent contributions weigh more than stale items.",
    signals: [
      "Public repos, merged PRs, and language footprint",
      "Stack Overflow, Devpost, LinkedIn, and manual claims with URLs",
      "Web corroboration when GitHub evidence is sparse",
    ],
  },
  {
    key: "consistency",
    label: scoreLabels.consistency,
    weight: "25%",
    summary: "Years of public activity and how recently they shipped work.",
    description:
      "Rewards sustained presence in public work, not one-off spikes. Based on how long they've been active and date of last meaningful contribution. Longer track records score higher; extended inactivity (90+ days without signals) gradually lowers this dimension.",
    signals: [
      "Account age on connected platforms",
      "Recency of repos, PRs, answers, or talks",
      "Steady activity vs. long dormant gaps",
    ],
  },
  {
    key: "peer_verification",
    label: scoreLabels.peerVerification,
    weight: "15%",
    summary: "Colleague attestations to specific skills or projects.",
    description:
      "Captures third-party validation through TrustGraph peer invites — a colleague vouching for a skill area they worked with. Unclaimed shadow profiles receive a modest baseline when platform evidence is verified; each accepted peer reference adds meaningful lift up to the cap.",
    signals: [
      "Verified peer references on claimed passports",
      "Baseline for verified GitHub / platform evidence",
      "No payment or self-endorsement — peers only",
    ],
  },
  {
    key: "impact_signals",
    label: scoreLabels.impactSignals,
    weight: "25%",
    summary: "Outcomes that show reach — stars, followers, flagship work, wins.",
    description:
      "Focuses on measurable impact from public work: repository stars, follower reach, flagship project prominence, merged PR volume, hackathon wins, and conference or publication credits. Large numbers use log scaling so one viral repo doesn't drown out everything else, while still rewarding real open-source and community impact.",
    signals: [
      "GitHub stars, followers, and flagship repo reach",
      "Merged PRs and public repository count",
      "Hackathons, talks, publications, and notable wins",
    ],
  },
] as const;

export const scoreOverview = {
  title: "How Trust Score works",
  subtitle:
    "One composite score (0–100) built from four explainable dimensions. Every dimension maps to evidence you can inspect — no black box.",
  formula:
    "Overall score = Evidence Depth (35%) + Consistency (25%) + Peer Verification (15%) + Impact Signals (25%), plus small renown bonuses for exceptional open-source reach.",
  recruiterNote:
    "Use the overall score to prioritize candidates, then read the dimension breakdown and evidence list to understand why. Payment never increases scores; only verifiable public work and peer attestations do.",
  passportNote:
    "Your score updates as you connect sources, add evidence, and collect peer references. Pro unlocks history and insights — not extra points.",
} as const;

export function scoreDimensionByKey(key: ScoreDimensionKey) {
  return scoreDimensionMeta.find((d) => d.key === key);
}
