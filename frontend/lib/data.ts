import type {
  ArchitectureLayer,
  EvidenceItem,
  HowItWorksStep,
  LandingStat,
  NavLink,
  PricingTier,
  PrincipleCard,
  ProblemCard,
  ScoreSignal,
  Testimonial,
  TrustDimension,
} from "@/types/trust";
import { lottieAssets } from "@/constants/lottie";

export const navLinks: NavLink[] = [
  { href: "#problem", label: "Why TrustGraph" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export const heroContent = {
  badge: "Now in early access · 4,200 profiles claimed",
  titleLine1: "Your reputation",
  titleLine2: "finally portable.",
  subhead:
    "One link that answers the question every professional relationship starts with — backed by evidence, not claims.",
  primaryCta: "Claim your passport",
  secondaryCta: "See a live example",
  proofLine: "Free forever · No tests or forms · Score in under 60 seconds",
};

export const stats: LandingStat[] = [
  { value: 4200, suffix: "+", label: "Profiles", icon: "users" },
  { value: 840, suffix: "K+", label: "Evidence items", icon: "files" },
  { value: 63, label: "Countries", icon: "globe" },
  { value: 60, prefix: "<", suffix: "s", label: "Time to score", icon: "timer", format: "text" },
];

export const platformLogos = [
  "GitHub",
  "Stack Overflow",
  "Devpost",
  "LinkedIn",
  "Google Scholar",
  "arXiv",
  "Sessionize",
  "Devfolio",
  "Conference talks",
];

export const passportDemo = {
  label: "Trust Passport",
  title: "One link that shows what you've actually built.",
  body: "Share a single URL instead of a résumé. Every claim links to public proof — recruiters see capability, not keyword stuffing.",
  bullets: [
    "Evidence from GitHub, Stack Overflow, Devpost, and more",
    "Explainable trust score with named dimensions",
    "Teaser view for anyone; full detail when it matters",
    "Updates automatically as you ship more work",
  ],
  cta: "Claim your passport",
  exampleLink: "See a live example",
  profile: {
    name: "Rishi Paul",
    handle: "rishicds",
    score: 82,
    delta: 3,
    url: "trustgraph.com/rishicds",
  },
};

export const passportDimensions: TrustDimension[] = [
  { name: "Evidence", value: 88, color: "bg-accent" },
  { name: "Consistency", value: 74, color: "bg-accent" },
  { name: "Impact", value: 61, color: "bg-accent" },
  { name: "Peer", value: 40, color: "bg-accent" },
];

export const passportEvidence: EvidenceItem[] = [
  { source: "github", label: "88 merged pull requests", verified: true, sourceLabel: "GitHub" },
  { source: "github", label: "37 public repositories", verified: true, sourceLabel: "GitHub" },
  { source: "stackoverflow", label: "2 accepted answers", verified: true, sourceLabel: "SO" },
];

export const problemSection = {
  label: "The problem",
  title: "Your reputation is trapped. Every platform is an island.",
};

export const problemCards: ProblemCard[] = [
  {
    icon: "search",
    title: "For Recruiters",
    description:
      "Keyword-matching and vibes-based shortlisting. No way to distinguish a real builder from a polished CV optimizer.",
    quote: "I spend 3 hours verifying what should be a 30-second check.",
  },
  {
    icon: "rocket",
    title: "For Founders & Open Source",
    description:
      "Evaluating a co-founder or contributor beyond LinkedIn is guesswork. Fake contributors degrade community health.",
    quote: "We got burned by someone whose GitHub was all green squares — none of it was real work.",
  },
  {
    icon: "briefcase",
    title: "For Freelancers",
    description:
      "Five years of five-star reviews on one platform earns zero credibility on the next. Reputation cannot move with you.",
    quote: "I rebuilt my reputation from scratch three times. It's exhausting.",
  },
];

export const architectureSection = {
  label: "Architecture",
  title: "Four layers of verifiable trust.",
};

export const architectureLayers: ArchitectureLayer[] = [
  {
    index: "01",
    title: "Capability",
    body: "Skills inferred from evidence — never self-assessed. If you've shipped it, it shows.",
    accent: true,
  },
  {
    index: "02",
    title: "Evidence",
    body: "240 merged PRs. 37 repos. 4 talks. 3 wins. The record is the profile.",
  },
  {
    index: "03",
    title: "Consistency",
    body: "Sustained effort across years weighs more than recent bursts. The anti-gaming layer.",
  },
  {
    index: "04",
    title: "Trust Score",
    body: "Explainable, not black-box. Every point has a reason linked to evidence.",
  },
];

export const howItWorksSection = {
  label: "How it works",
  title: "A score in under 60 seconds.",
  subtitle: "No forms. No tests.",
};

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: "01",
    title: "Connect sources",
    body: "Link GitHub, Stack Overflow, or Devpost. We pull public evidence automatically.",
    time: "<30 seconds",
    icon: "connect",
    lottie: lottieAssets.onboardingConnect,
  },
  {
    step: "02",
    title: "We collect evidence",
    body: "Merged PRs, accepted answers, hackathon wins — every item links to proof.",
    time: "Automatic",
    icon: "collect",
    lottie: lottieAssets.onboardingEvidence,
  },
  {
    step: "03",
    title: "Share your passport",
    body: "One link to send anywhere you'd share a résumé or portfolio.",
    time: "5 seconds",
    icon: "share",
    lottie: lottieAssets.onboardingPassport,
  },
];

export const testimonialsSection = {
  label: "Social proof",
  title: "Builders who claimed their passport.",
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "I sent my TrustGraph link instead of a résumé. The recruiter replied in 2 hours. That never happens.",
    boldPhrase: "That never happens.",
    name: "Arjun Krishnan",
    role: "Full-stack",
    city: "Bangalore",
    score: 79,
    initials: "AK",
  },
  {
    quote: "The consistency score tells me everything about a contributor in 10 seconds.",
    boldPhrase: "in 10 seconds.",
    name: "Sara Müller",
    role: "OSS maintainer",
    city: "Berlin",
    score: 91,
    initials: "SM",
  },
  {
    quote:
      "For the first time I have something that shows the whole picture — not just whatever slice each platform saw.",
    boldPhrase: "shows the whole picture",
    name: "Priya Chandran",
    role: "Independent dev",
    city: "Mumbai",
    score: 86,
    initials: "PC",
  },
];

export const scoreExplainerSection = {
  label: "Explainability",
  title: "Every score has a reason.",
  subtitle: "No black boxes — ever.",
  rightTitle: "Unlike a credit score, you can see exactly why.",
  rightBody:
    "Every signal affecting your score is listed, linked, and disputable. Positive contributions and gaps are both visible — so you know what to improve and recruiters know what they're betting on.",
};

export const scoreSignals: ScoreSignal[] = [
  { positive: true, text: "88 merged PRs on GitHub", points: 31 },
  { positive: true, text: "Active since 2021, no gap >60d", points: 24 },
  { positive: true, text: "3 hackathon wins on Devpost", points: 18 },
  { positive: true, text: "Stars from non-followers", points: 14 },
  { positive: false, text: "2 listed projects, no public repo", points: -9 },
  { positive: false, text: "Peer verification pending (0/3)", points: -4 },
];

export const scoreComparison = {
  headers: ["", "Explainable", "Portable", "Evidence-linked", "Disputable"],
  rows: [
    { name: "TrustGraph", values: ["✓", "✓", "✓", "✓"], highlight: true },
    { name: "LinkedIn", values: ["✗", "~", "✗", "✗"] },
    { name: "Credit score", values: ["✗", "✓", "✗", "~"] },
    { name: "Self-reported CV", values: ["~", "✓", "✗", "✗"] },
  ],
};

export const integrationSection = {
  label: "Integrations",
  title: "Connected to where your work already lives.",
  body: "Every source connects once. Evidence updates automatically.",
  bullets: [
    "GitHub repos, PRs, and languages sync on connect",
    "Stack Overflow answers and reputation indexed",
    "Devpost wins and hackathon projects added",
    "Manual claims for talks and publications with URLs",
  ],
  cta: "Connect your first source",
  lottie: lottieAssets.onboardingConnect,
};

export const integrationInnerOrbit = ["GitHub", "Stack Overflow", "Devpost"];
export const integrationOuterOrbit = ["LinkedIn", "Google Scholar", "arXiv", "Sessionize"];

export const pricingSection = {
  label: "Pricing",
  title: "Simple plans. No score inflation.",
  subtitle:
    "Payment never boosts your score. Pro unlocks insight — not points. Recruiter discovery requires your explicit opt-in.",
};

export const pricingTagline = pricingSection.subtitle;

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "Trust Passport, core sources, explainable score",
    features: [
      "Trust Passport",
      "GitHub + SO + Devpost",
      "Score + explainability",
      "README badge",
      "3 peer verifications",
      "Privacy controls",
    ],
    ctaLabel: "Get started",
  },
  {
    name: "Pro",
    price: "$15",
    priceNote: "/mo",
    description: "History, insights, timeline, and API access",
    features: [
      "Everything in Free",
      "Score history",
      "Comparative insights",
      "Trust Timeline",
      "Recruiter signal alerts",
      "Webhooks & API key",
      "Unlimited peer verifications",
    ],
    featured: true,
    dark: true,
    ctaLabel: "Upgrade to Pro",
  },
  {
    name: "Recruiter",
    price: "$149",
    priceNote: "/mo",
    description: "Search opt-in profiles by score, skill, and location",
    features: [
      "Search by score/skill/location",
      "Opt-in profiles only",
      "One-click verification",
      "Shortlist exports",
      "Team trust scores",
    ],
    horizontal: true,
    ctaLabel: "Contact sales",
  },
];

export const principlesSection = {
  label: "Principles",
  title: "How we earn your trust.",
};

export const principleCards: PrincipleCard[] = [
  {
    lottie: lottieAssets.principlesLock,
    title: "Users first, recruiters second",
    body: "You choose who can discover you. Recruiter discovery requires your explicit opt-in. Payment never changes your score.",
  },
  {
    lottie: lottieAssets.principlesOpenBook,
    title: "No black boxes, ever",
    body: "Every signal affecting your score is listed, linked, and disputable. Human review within 48 hours of any dispute.",
  },
  {
    lottie: lottieAssets.principlesExitDoor,
    title: "Your data, your exit",
    body: "Delete your account and your profile disappears within 30 days. We don't sell raw evidence data. Disconnect any source at any time.",
  },
];

export const finalCta = {
  titleLine1: "Your proof of work",
  titleLine2: "deserves to move with you.",
  subtitle:
    "Claim your Trust Passport in under 60 seconds. No forms. No tests. Just evidence.",
  primaryCta: "Claim your passport",
  secondaryCta: "See a live example",
  proofLine: "Free forever · trustgraph.com/you",
  lottie: lottieAssets.onboardingPassport,
};

export const footerContent = {
  tagline: "Portable, evidence-backed reputation for builders.",
  productLinks: [
    { href: "#problem", label: "Why TrustGraph" },
    { href: "#passport", label: "Trust Passport" },
    { href: "#architecture", label: "Architecture" },
    { href: "#pricing", label: "Pricing" },
  ],
  developerLinks: [
    { href: "/docs", label: "API & Badges" },
    { href: "/docs", label: "Documentation" },
    { href: "https://github.com", label: "GitHub" },
    { href: "#", label: "Changelog" },
  ],
  companyLinks: [
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
    { href: "#", label: "Blog" },
    { href: "#", label: "Contact" },
  ],
  pills: ["Evidence-first", "Privacy-safe", "No black boxes"],
};
