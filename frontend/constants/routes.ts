export const routes = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  signup: "/sign-up",
  login: "/sign-in",
  onboarding: "/onboarding",
  recruiterOnboarding: "/recruiter/onboarding",
  recruiterDashboard: "/recruiter/dashboard",
  passport: "/passport",
  dashboard: "/dashboard",
  settings: "/settings",
  admin: "/admin",
  docs: "/docs",
  sampleProfile: (handle: string) => `/${handle}`,
  claimSignup: (handle: string) => `/sign-up?claim=${handle}`,
} as const;

/** App routes that must not be treated as profile handles. */
export const reservedHandles = new Set([
  "dashboard",
  "onboarding",
  "recruiter",
  "passport",
  "settings",
  "admin",
  "sign-in",
  "sign-up",
  "signup",
  "login",
  "docs",
  "verify",
  "api",
]);

export const anchors = {
  features: "#features",
  howItWorks: "#how-it-works",
  pricing: "#pricing",
} as const;
