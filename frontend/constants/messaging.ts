export const meta = {
  defaultTitle: "TrustGraph — The Trust Layer of the Internet",
  defaultDescription:
    "Portable, evidence-backed reputation. One link answers: can I trust this person? Proof over claims — not a portfolio, not a social network.",
  homeOgTitle: "TrustGraph — Your reputation, finally portable.",
  homeOgDescription:
    "One Trust Passport link backed by GitHub, Stack Overflow, Devpost & more. Explainable trust score in under 60 seconds — free forever. Claim yours →",
  profileTitle: (name: string) => `${name} — TrustGraph`,
  profileDescription: (score: number, evidenceCount: number) =>
    `Trust Score ${score.toFixed(0)}/100 · ${evidenceCount} evidence items`,
  profileOgTitle: (name: string, score: number) =>
    `${name} — Trust Score ${score.toFixed(0)}/100 · TrustGraph Passport`,
  profileOgDescription: (input: {
    displayName: string;
    score: number;
    evidenceCount: number;
    topCapability?: string;
    isShadow: boolean;
    headline?: string;
  }) => {
    const { displayName, score, evidenceCount, topCapability, isShadow, headline } = input;
    const capability = topCapability ? ` · Top strength: ${topCapability}` : "";
    const hook = headline
      ? headline.length > 120
        ? `${headline.slice(0, 117)}…`
        : headline
      : `${displayName} scores ${score.toFixed(0)}/100 on TrustGraph with ${evidenceCount} evidence-backed signals${capability}.`;
    const cta = isShadow
      ? " Unclaimed profile — verify your GitHub and claim your free Trust Passport."
      : " Portable reputation you can share anywhere. Get your own Trust Passport →";
    return `${hook}${cta}`;
  },
  profileFallbackTitle: "Profile — TrustGraph",
  profileFallbackDescription:
    "Evidence-backed Trust Passport on TrustGraph. One link answers: can I trust this person?",
} as const;

export const navigation = {
  links: [
    { href: "#moat", label: "Why TrustGraph" },
    { href: "#layers", label: "Architecture" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
  ],
  login: "Log in",
  getStarted: "Get started",
} as const;

export const footer = {
  productHeading: "Product",
  productLinks: [
    { href: "#moat", label: "Why TrustGraph" },
    { href: "#layers", label: "Architecture" },
    { href: "/sign-up", label: "Trust Passport" },
    { href: "#pricing", label: "Pricing" },
  ],
  developersHeading: "Developers",
  developerLinks: [
    { href: "/docs", label: "API & badges" },
    { href: "/docs", label: "Documentation" },
  ],
  companyHeading: "Company",
  companyLinks: [
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
  ],
  newsletterHeading: "Stay updated",
  newsletterDescription: "Weekly trust digest and product updates.",
  newsletterPlaceholder: "you@company.com",
  newsletterCta: "Join",
} as const;

export const landing = {
  hero: {
    announcement: "Proof over claims · Evidence-first · Privacy-safe",
    titleLine1: "The trust layer",
    titleLine2: "of the internet",
    thesis:
      "The credit score of human capability — except transparent, explainable, and portable.",
    tagline: "Trust anyone online with verifiable reputation data.",
    defaultPreviewHandle: "rishicds",
    searchPlaceholder: "GitHub username — rishicds, torvalds, your-handle…",
    searchPlaceholderMobile: "GitHub username",
    tryNow: "Claim your passport",
    viewSample: "View sample passport",
    preview: {
      label: "Trust Passport preview",
      handle: "rishicds",
      score: "—",
      delta: "from public evidence",
      evidence: [
        "GitHub repos · merged PRs · languages",
        "Stack Overflow · Devpost · talks",
        "One link · proof over claims",
      ],
    },
    lookup: {
      placeholder: "GitHub username",
      searchAria: "Look up GitHub username",
      button: "Look up",
      loading: "Analyzing public GitHub evidence…",
      error: "Could not find that GitHub user. Try another username.",
      emptyHint: "Enter any public GitHub username to preview their trust score.",
      fromEvidence: "from public evidence",
      viewPassport: "View passport",
      inviteTitle: (name: string) => `Know ${name}?`,
      inviteBody:
        "Invite them to claim their Trust Passport. Once verified, peer references and connected sources can raise their score.",
      copyInvite: "Copy invite link",
      copied: "Copied!",
      sendInvite: "Invite them",
      inviteEmailSubject: (name: string) => `${name}, your TrustGraph trust score is ready`,
      inviteEmailBody: (name: string, score: number, inviteUrl: string) =>
        `Hi ${name},\n\nI looked up your public developer reputation on TrustGraph — your estimated trust score is ${score}/100 based on GitHub evidence.\n\nClaim your Trust Passport to unlock peer verification and boost your score:\n${inviteUrl}\n`,
    },
  },
  heroSocialProof: {
    title: "Evidence aggregated from the platforms developers already use",
  },
  socialProof: {
    title: "Evidence aggregated from platforms you already use",
    platforms: ["GitHub", "Stack Overflow", "Devpost", "LinkedIn", "Conference talks"],
  },
  gap: {
    title: "The gap the internet left",
    subtitle:
      "Every major coordination problem has been solved. Reputation is still fragmented across every platform you've ever worked on — it cannot move with you.",
    solvedLabel: "Solved",
    unsolvedLabel: "Never solved",
    solved: [
      { label: "Information", outcome: "Search engines" },
      { label: "Communication", outcome: "Social platforms" },
      { label: "Payments", outcome: "Stripe · PayPal" },
      { label: "Code", outcome: "GitHub" },
      { label: "Identity", outcome: "Clerk · Auth0" },
    ],
    unsolved: {
      label: "Reputation portability",
      body: "Your proof of work resets on every new platform. TrustGraph bridges the islands into one portable, evidence-backed link.",
    },
  },
  fourLayers: {
    title: "Four layers of trust",
    subtitle:
      "Not a portfolio. Not a social network. A living record of verifiable capability — every claim links to proof.",
    layers: [
      {
        index: "01",
        title: "Capability",
        body: "Skills inferred from evidence — frontend, backend, AI, leadership — never self-assessed.",
      },
      {
        index: "02",
        title: "Evidence",
        body: "240 merged PRs. 37 repos. 4 talks. 3 hackathon wins. The record is the profile.",
      },
      {
        index: "03",
        title: "Consistency",
        body: "Long-term activity across years. Sustained effort weighs more than bursts — the anti-gaming layer.",
      },
      {
        index: "04",
        title: "Trust score",
        body: "Verified vs unverified ratio. Positive and negative signals listed explicitly. No black box.",
      },
    ],
  },
  problems: {
    title: "Built for everyone who asks “can I trust them?”",
    subtitle: "One portable link replaces gut feel, keyword matching, and meaningless endorsements.",
    personas: [
      {
        title: "Recruiters",
        body: "Distinguish real builders from resume optimizers. Deep-search mode cross-references public evidence across the web.",
      },
      {
        title: "Founders",
        body: "Evaluate co-founders and early hires beyond LinkedIn — actual output history, not polished claims.",
      },
      {
        title: "Open source",
        body: "Detect fake contributors and reputation farmers before they degrade community health.",
      },
      {
        title: "Freelancers",
        body: "Reputation that moves with you. Five years on one platform should count on the next.",
      },
      {
        title: "Investors",
        body: "Replace pitch-deck guesswork with proof-backed founder credentials and team trust scores.",
      },
      {
        title: "Accelerators",
        body: "Standardised verification of claimed credentials — applications backed by public evidence.",
      },
    ],
  },
  value: {
    title: "Proof over claims",
    subtitle: "Not a portfolio. Not a social network. A portable record of verifiable capability.",
    pillars: [
      {
        index: "01",
        title: "Trust Passport",
        body: "Share your Trust Passport link instead of a resume. Teaser view for anyone; full evidence when it matters.",
      },
      {
        index: "02",
        title: "Evidence layer",
        body: "Merged PRs, accepted answers, hackathon wins, talks — every item links to public proof.",
      },
      {
        index: "03",
        title: "Explainable score",
        body: "One number with named dimensions. Positive and negative signals listed explicitly. No black box.",
      },
    ],
  },
  howItWorks: {
    title: "Value before you do any work",
    subtitle:
      "We bootstrap from public data on signup — no empty profile, no score of zero. Shadow profiles are ready to claim.",
    steps: [
      { step: "01", title: "Connect GitHub", body: "Repos, PRs, and languages sync automatically via Clerk.", time: "<30s" },
      { step: "02", title: "Add evidence", body: "Stack Overflow, Devpost, or a talk URL. Optional but strengthens your score.", time: "1–2m" },
      { step: "03", title: "Copy your passport", body: "One link to share anywhere you'd send a resume or portfolio.", time: "5s" },
    ],
  },
  featuredProfiles: {
    title: "Shadow profiles from public evidence",
    subtitle: "We may already have 60%+ of your profile. Claim it in 30 seconds.",
    empty: "Profiles loading…",
  },
  pricing: {
    title: "Users first. Recruiters second.",
    subtitle:
      "Payment never boosts your score. Pro unlocks insight — not points. Recruiter discovery requires your opt-in.",
    cta: "Get started",
    footnote: "Recruiter, team, and API tiers coming as we expand beyond developers.",
    plans: [
      {
        name: "Free",
        price: "$0",
        description: "Trust profile, passport link, README badge",
        featured: false,
        features: ["Trust Passport", "GitHub + SO + Devpost", "Peer verification", "Privacy controls"],
      },
      {
        name: "Pro",
        price: "$15/mo",
        description: "History, insights, timeline, API keys",
        featured: true,
        features: ["Score history", "Comparative insights", "Full timeline", "Webhooks & API key"],
      },
    ],
  },
  cta: {
    title: "Your reputation should move with you",
    subtitle:
      "One Trust Passport link — trustgraph.com/you — answers the question every professional relationship starts with.",
    primary: "Create your profile",
    secondary: "See a live example",
  },
} as const;
export const auth = {
  signup: {
    title: "Create your profile",
    subtitleDefault: "Start with your Trust Passport in under 3 minutes.",
    subtitleClaim: (handle: string) => `Claim @${handle} and unlock your Trust Passport.`,
    fields: {
      name: "Full name",
      email: "Email",
      handle: "Handle",
      password: "Password",
    },
    handlePlaceholder: "your-handle",
    submit: "Create account",
    submitting: "Creating...",
    hasAccount: "Already have an account?",
    loginLink: "Log in",
  },
  login: {
    title: "Welcome back",
    subtitle: "Log in to your TrustGraph profile.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in...",
    noAccount: "New to TrustGraph?",
    signupLink: "Create a profile",
  },
} as const;

export const onboarding = {
  loading: "Loading onboarding...",
  eyebrow: "Onboarding",
  title: "Build your Trust Passport",
  subtitle: "Connect evidence sources and reveal your score in under 3 minutes.",
  steps: [
    "Connect GitHub",
    "Add evidence",
    "Score reveal",
    "Trust Passport",
    "Peer verify",
  ],
  nav: {
    back: "Back",
    continue: "Continue",
    skipSources: "Skip for now",
  },
  sources: {
    title: "Step 2 — Link more accounts",
    description: "Optional sources strengthen your score. Connect LinkedIn, Stack Overflow, Devpost, Devfolio, or add a talk — skip anytime.",
    linkedinConnected: "LinkedIn connected — verified identity added to your passport.",
    soConnected: "Stack Overflow connected — nice work!",
    devpostConnected: "Devpost connected — hackathon wins added.",
    devfolioConnected: "Devfolio connected — hackathon wins and projects added.",
    connectedSummary: "Connected",
  },
  github: {
    title: "Step 1 — Connect GitHub",
    description: "We'll pull repos, merged PRs, and languages to bootstrap your evidence layer.",
    connectedTitle: "GitHub connected",
    connectedDescription: "Evidence synced from",
    placeholder: "GitHub username",
    connect: "Connect",
    connecting: "Connecting...",
    oauth: "Connect with GitHub OAuth",
  },
  stackoverflow: {
    title: "Step 2 — Connect Stack Overflow",
    description: "Add accepted answers and community reputation to your evidence layer.",
    placeholder: "Stack Overflow username",
    connect: "Connect",
    connecting: "Connecting...",
    skip: "Skip for now",
  },
  linkedin: {
    title: "LinkedIn",
    description: "Verify your professional identity. We sync from your Clerk-linked LinkedIn account — no scraping.",
    connect: "Connect with LinkedIn",
    connecting: "Connecting...",
    sync: "Sync LinkedIn",
    syncing: "Syncing...",
    oauthHint: "You'll sign in with LinkedIn to verify ownership. We only store your public profile slug as evidence.",
    slugPlaceholder: "your-linkedin-slug",
    slugHint: "From linkedin.com/in/your-slug — required if sync cannot read it from Clerk.",
    connectedDescription: "Verified identity synced from",
  },
  devpost: {
    title: "Step 2b — Connect Devpost",
    description: "Add hackathon projects and wins to your evidence layer.",
    placeholder: "Devpost username",
    connect: "Connect",
    connecting: "Connecting...",
  },
  devfolio: {
    title: "Connect Devfolio",
    description: "Paste your Devfolio profile URL or username — we'll scrape hackathon wins and projects during connect.",
    placeholder: "devfolio.co/@username or @username",
    connect: "Connect",
    connecting: "Connecting...",
  },
  manualClaim: {
    title: "Add a talk, publication, or job link",
    description:
      "Paste a public link to verify the claim. We mark entries with URLs as verified evidence on your passport.",
    titleLabel: "What did you do?",
    titleHint: "Conference talk, publication, portfolio piece, or role you applied for.",
    urlLabel: "Proof link",
    urlHint: "Talk recording, paper, portfolio page, or application URL (Workable links count as job applications).",
    typePlaceholder: "conference_talk",
    titlePlaceholder: "e.g. Ad Tech ML Engineer — Mercari",
    urlPlaceholder: "https://youtube.com/watch?v=… or https://apply.workable.com/…",
    submit: "Add to evidence",
    submitting: "Adding…",
  },
  clerkBootstrap: {
    title: "Connected from your Clerk account",
    github: "GitHub evidence synced automatically.",
    shadow: "We found a shadow profile you can claim.",
    claim: "Claim shadow profile",
  },
  score: {
    title: "Step 3 — Your trust score",
    description: "Based on your connected evidence. Scores update automatically as you add sources.",
  },
  passport: {
    title: "Step 4 — Copy your Trust Passport",
    description: "Share this link wherever you'd normally share your resume.",
    copy: "Copy link",
    copied: "Copied!",
    preview: "Preview public profile",
    finish: "Continue to peer invites",
  },
  peer: {
    title: "Step 5 — Invite peer verification",
    description: "Send a verification link to a colleague who can vouch for a skill area.",
    emailPlaceholder: "colleague@company.com",
    skillPlaceholder: "e.g. Backend engineering",
    contextPlaceholder: "Optional context (project, team)",
    send: "Send invite",
    sending: "Sending...",
    sent: "Invite sent — share the confirm link with your peer",
    finish: "Finish onboarding",
  },
  badge: {
    title: "Embed badge",
    description: "Add this markdown to your GitHub README — it updates dynamically.",
    copy: "Copy markdown",
    copied: "Copied!",
  },
  skip: "Skip to dashboard",
} as const;

export const dashboard = {
  loading: "Loading dashboard...",
  eyebrow: "Dashboard",
  welcome: (name: string) => `Welcome, ${name}`,
  viewProfile: "View public profile",
  logout: "Log out",
  empty: {
    title: "No profile yet",
    subtitle: "Complete onboarding to create your Trust Passport.",
    cta: "Start onboarding",
  },
  trustScore: "Trust Score",
  onboardingIncomplete: "Onboarding incomplete",
  passport: {
    title: "Trust Passport",
    continue: "Continue onboarding",
  },
  sources: {
    title: "Connected sources",
    description: "Connect platforms to grow your evidence layer and trust score.",
    empty: "No sources connected yet",
    connected: "Connected",
    pending: "Not connected",
    connectCta: "Connect GitHub",
    connectFailed: "Could not connect this source. Try again.",
    moreSources: "Add talks, publications & more",
  },
  evidence: {
    title: "Evidence",
    suffix: "verified artefacts indexed",
  },
  alerts: {
    title: "Trust alerts",
    empty: "No alerts — your profile is healthy",
  },
  insights: {
    title: "Comparative insights",
  },
  history: {
    title: "Score history",
  },
  badge: {
    title: "README badge",
    description: "Embed in your GitHub profile — updates when your score changes.",
  },
} as const;

export const profile = {
  badges: {
    shadow: "Shadow profile",
    verified: "Verified evidence",
  },
  capabilities: {
    title: "Top capabilities",
    topFiveTitle: "Top 5 capabilities & ideal role",
    evidenceSuffix: "evidence items",
  },
  score: {
    label: "Trust score",
    title: "Score breakdown",
    tapBreakdown: "Tap for breakdown",
    tapBack: "Tap to return",
    flipLabel: "Trust score card — tap to flip between score and breakdown",
    max: "/ 100",
    deltaSuffix: "this month",
    positiveTitle: "Positive signals",
    negativeTitle: "Areas to improve",
  },
  stats: {
    title: "Public evidence stats",
    subtitle: "Verified signals indexed from connected platforms — log-scaled where noted in scoring.",
    evidence: "Evidence items",
    topCapability: "Top capability",
    topFiveCapabilities: "Top 5 capabilities & ideal role",
    languagesNote: "All indexed languages (top 4 count toward score)",
    categories: {
      impact: "Impact signals",
      contribution: "Contributions",
      community: "Community",
      language: "Languages",
      achievement: "Achievements",
      peer: "Peer verification",
      identity: "Identity",
      claim: "Claims",
      renown: "Renown",
    },
  },
  social: {
    title: "Links",
    email: "Email",
    empty: "No social links on GitHub profile",
  },
  aiInsight: {
    title: "AI cross-platform insight",
    consistency: "Consistency",
    gaps: "Evidence gaps",
    disclaimer: "Generated from public links on your GitHub profile — not used for scoring without verification",
  },
  recruiter: {
    title: "Recruiter deep search",
    subtitle: "Three deep web searches per week — scans public sources and updates trust score with AI hiring insights.",
    run: "Run recruiter mode",
    running: "Searching the web and analyzing evidence…",
    queued: "Queued — starting soon…",
    progressLabel: "Search progress",
    sourcesFound: "Sources found",
    waitingForSources: "Scanning public sources…",
    backgroundHint: "Runs in the background — safe to close this page. Return here to see results.",
    backgroundResume: "Resuming your background search…",
    completedWhileAway: "Your recruiter search finished while you were away.",
    cooldownUser: "You've used all 3 recruiter searches this week. Available again",
    cooldownProfile: "This profile was deep-searched recently. Available again",
    ownProfile: "Recruiter mode is for evaluating other profiles.",
    scoreUpdate: "Trust score updated",
    hiringSignals: "Hiring signals",
    redFlags: "Red flags",
    webFindings: "Web findings",
    disclaimer: "AI-generated from public web data — verify before hiring decisions",
  },
  shadowClaim: {
    title: "Public evidence found",
    subtitle: "Claim this profile to unlock your Trust Passport.",
    cta: "Claim this profile",
    verifyNote:
      "You must sign in with the same GitHub account as this profile (@handle) to claim it. Each account can own only one Trust Passport.",
    checking: "Checking claim eligibility…",
    claiming: "Claiming profile…",
    connectGitHub: "Connect GitHub in settings",
    verifiedPrefix: "Verified as @",
  },
  dispute: {
    title: "Dispute this profile",
    subtitle:
      "If someone else claimed your Trust Passport, file a dispute. Admins review ownership and can restore the profile to an unclaimed state.",
    reasonLabel: "Reason",
    detailsLabel: "Additional details",
    detailsPlaceholder: "Link your GitHub, explain why you are the rightful owner…",
    submit: "File dispute",
    submitting: "Submitting…",
    signInCta: "Sign in to file a dispute",
  },
  teaser: {
    publicPreview: "Public preview",
    signInPrompt: "Sign in for full evidence, timeline, and score breakdown.",
    signInLink: "Sign in",
    signInCta: "Sign in for full view",
  },
  authenticated: {
    evidenceHint: "Public evidence indexed from GitHub and connected platforms.",
    comparativeInsights: "Comparative insights are available on your own Pro profile.",
    viewYourProfile: "View your profile",
  },
  timeline: {
    title: "Trust timeline",
    empty: "No timeline events yet",
  },
  evidence: {
    title: "Evidence layer",
    verified: "Verified",
    viewSource: "View source",
    countSuffix: "items",
  },
  insights: {
    title: "Comparative insights",
  },
  footer: {
    prompt: "Want your own Trust Passport?",
    cta: "Verify your profile too",
  },
  card: {
    evidenceSuffix: "evidence items",
    shadowSuffix: "Shadow profile",
  },
} as const;

export const errors = {
  signupFailed: "Signup failed",
  loginFailed: "Login failed",
  githubConnectFailed: "Could not connect GitHub",
  stackoverflowConnectFailed: "Could not connect Stack Overflow",
  linkedinConnectFailed: "Could not connect LinkedIn — link it in Clerk first, then sync.",
  peerInviteFailed: "Could not send peer invite",
} as const;

export const notFound = {
  code: "404",
  title: "Profile not found",
  description: "This Trust Passport doesn't exist or is set to private.",
  cta: "Back to home",
} as const;

export const scoreLabels = {
  evidenceDepth: "Evidence Depth",
  consistency: "Consistency",
  peerVerification: "Peer Verification",
  impactSignals: "Impact Signals",
  trustRatio: "Trust Ratio",
} as const;
