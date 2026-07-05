export interface TrustDimension {
  name: string;
  value: number;
  color: string;
}

export interface EvidenceItem {
  source: "github" | "stackoverflow" | "devpost" | "scholar" | "conference";
  label: string;
  verified: boolean;
  sourceLabel: string;
}

export interface ScoreSignal {
  positive: boolean;
  text: string;
  points: number;
}

export interface Testimonial {
  quote: string;
  boldPhrase: string;
  name: string;
  role: string;
  city: string;
  score: number;
  initials: string;
}

export interface PricingTier {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  dimFeatures?: string[];
  featured?: boolean;
  ctaLabel: string;
  dark?: boolean;
  horizontal?: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}

export type ProblemIcon = "search" | "rocket" | "briefcase";

export interface ProblemCard {
  icon: ProblemIcon;
  title: string;
  description: string;
  quote: string;
}

export interface ArchitectureLayer {
  index: string;
  title: string;
  body: string;
  accent?: boolean;
}

export type HowItWorksIcon = "connect" | "collect" | "share";

export interface HowItWorksStep {
  step: string;
  title: string;
  body: string;
  time: string;
  icon: HowItWorksIcon;
  lottie: string;
}

export interface PrincipleCard {
  lottie: string;
  title: string;
  body: string;
}

export type StatIcon = "users" | "files" | "globe" | "timer";

export interface LandingStat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon: StatIcon;
  format?: "number" | "text";
}
