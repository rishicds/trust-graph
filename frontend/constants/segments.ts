export type ProfessionalSegment = "developer" | "designer" | "researcher" | "founder" | "general";

export type AccountType = "passport" | "recruiter";

export type SegmentOption = {
  id: ProfessionalSegment;
  label: string;
  description: string;
  phase: string;
  enabled: boolean;
};

export const professionalSegments: SegmentOption[] = [
  {
    id: "developer",
    label: "Developer",
    description: "GitHub, Stack Overflow, Devpost, and open-source evidence.",
    phase: "Phase 1 · Live",
    enabled: true,
  },
  {
    id: "designer",
    label: "Designer",
    description: "Dribbble, Behance, Figma Community, and shipped product work.",
    phase: "Phase 2",
    enabled: false,
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Publications, citations, peer review, and conference records.",
    phase: "Phase 3",
    enabled: false,
  },
  {
    id: "founder",
    label: "Founder",
    description: "Execution signals, team coverage, and startup track record.",
    phase: "Phase 4",
    enabled: false,
  },
  {
    id: "general",
    label: "Other professional",
    description: "Finance, law, medicine, marketing, and more.",
    phase: "Phase 5",
    enabled: false,
  },
];

export const accountTypeOptions = [
  {
    id: "passport" as const,
    title: "I want a Trust Passport",
    subtitle: "Build your portable, evidence-backed reputation.",
    description:
      "Connect GitHub and other public proof. Share one link that answers: can I trust this person?",
  },
  {
    id: "recruiter" as const,
    title: "I'm a recruiter",
    subtitle: "Search indexed passports and the public web for verified talent.",
    description:
      "Tell us about your company, then find candidates with natural-language search — Tavily for live web results, TrustGraph for evidence-backed profiles.",
  },
];
