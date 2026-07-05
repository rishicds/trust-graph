import type { Step } from "react-joyride";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export const WIZARD_STEP_COUNT = 5;

/** Joyride targets for each wizard step — must match data-tour attributes in the UI */
export const tourTargets = {
  progress: "[data-tour='onboarding-progress']",
  header: "[data-tour='onboarding-header']",
  stepPanel: "[data-tour='onboarding-step-panel']",
  githubConnect: "[data-tour='github-connect']",
  githubConnected: "[data-tour='github-connected']",
  sourceTabs: "[data-tour='source-tabs']",
  sourceForm: "[data-tour='source-form']",
  scoreDisplay: "[data-tour='score-display']",
  scoreDimensions: "[data-tour='score-dimensions']",
  passportLink: "[data-tour='passport-link']",
  passportBadge: "[data-tour='passport-badge']",
  peerForm: "[data-tour='peer-form']",
  navActions: "[data-tour='nav-actions']",
} as const;

const welcomeSteps: Step[] = [
  {
    target: tourTargets.header,
    title: "Welcome to TrustGraph",
    content:
      "In about 3 minutes you'll connect evidence sources, reveal your trust score, and get a shareable Trust Passport link.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: tourTargets.progress,
    title: "Your journey",
    content:
      "Follow these five steps at your own pace. You can go back anytime, or skip optional steps and finish later from the dashboard.",
    placement: "bottom",
  },
];

const githubSteps = (connected: boolean): Step[] => {
  if (connected) {
    return [
      {
        target: tourTargets.githubConnected,
        title: "GitHub already connected",
        content:
          "We pulled your repos, merged PRs, and languages from Clerk. Review the summary, then continue to add more evidence.",
        placement: "top",
        skipBeacon: true,
      },
    ];
  }
  return [
    {
      target: tourTargets.githubConnect,
      title: "Connect GitHub",
      content:
        "Enter your GitHub username — or sign in with GitHub via Clerk and we'll sync automatically on load.",
      placement: "top",
      skipBeacon: true,
    },
    {
      target: tourTargets.navActions,
      title: "Continue when ready",
      content: "Once connected, hit Continue to add Stack Overflow, Devpost, or manual talk claims.",
      placement: "top",
    },
  ];
};

const sourcesSteps: Step[] = [
  {
    target: tourTargets.sourceTabs,
    title: "Link more accounts",
    content:
      "LinkedIn, Stack Overflow, Devpost, and talks strengthen your score. Connect any — or skip and add later from settings.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: tourTargets.sourceForm,
    title: "Connect a source",
    content: "Pick a tab, enter your username or sign in with LinkedIn. We only use public, verifiable data.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: tourTargets.navActions,
    title: "Skip is OK",
    content: "Optional sources can wait. Hit Continue when you're ready to see your trust score.",
    placement: "top",
  },
];

const scoreSteps: Step[] = [
  {
    target: tourTargets.scoreDisplay,
    title: "Your trust score",
    content:
      "This composite score reflects evidence depth, consistency, peer verification, and impact signals from your public work.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: tourTargets.scoreDimensions,
    title: "Four dimensions",
    content:
      "Each dimension is explainable — hover the breakdown to see what contributed. Scores refresh as you add evidence.",
    placement: "top",
  },
];

const passportSteps: Step[] = [
  {
    target: tourTargets.passportLink,
    title: "Your Trust Passport",
    content:
      "This is your portable reputation link — use it on LinkedIn, email signatures, or anywhere you'd share a resume.",
    placement: "top",
    skipBeacon: true,
  },
  {
    target: tourTargets.passportBadge,
    title: "Embed badge",
    content:
      "Copy the markdown snippet for your GitHub README. The badge updates dynamically when your score changes.",
    placement: "top",
  },
];

const peerSteps: Step[] = [
  {
    target: tourTargets.peerForm,
    title: "Peer verification",
    content:
      "Invite a colleague who can vouch for a skill area. Peer verification boosts your score — but you can finish without it.",
    placement: "top",
    skipBeacon: true,
  },
  {
    target: tourTargets.navActions,
    title: "You're almost done",
    content: "Send an invite or skip straight to your dashboard. You can always invite peers later from settings.",
    placement: "top",
  },
];

export function getTourSteps(wizardStep: WizardStep, hasGitHub: boolean): Step[] {
  switch (wizardStep) {
    case 1:
      return hasGitHub ? githubSteps(true) : [...welcomeSteps, ...githubSteps(false)];
    case 2:
      return sourcesSteps;
    case 3:
      return scoreSteps;
    case 4:
      return passportSteps;
    case 5:
      return peerSteps;
    default:
      return welcomeSteps;
  }
}

export const joyrideLocale = {
  back: "Back",
  close: "Close",
  last: "Got it",
  next: "Next",
  nextWithProgress: "Next ({current} of {total})",
  skip: "Skip tour",
};

export const joyrideOptions = {
  primaryColor: "#7BE13B",
  textColor: "#111111",
  backgroundColor: "#FFFFFF",
  arrowColor: "#FFFFFF",
  overlayColor: "rgba(17, 17, 17, 0.45)",
  spotlightRadius: 16,
  spotlightPadding: 12,
  zIndex: 10000,
  width: 340,
};
