export const layout = {
  page: "min-h-screen",
  pageCentered: "flex min-h-screen items-center justify-center px-6 pt-24 pb-16",
  pageWithNav: "mx-auto max-w-5xl px-6 pt-32 pb-20",
  pageWithNavNarrow: "mx-auto max-w-3xl px-6 pt-32 pb-20",
  container: "mx-auto max-w-6xl px-6",
  containerMd: "mx-auto max-w-5xl px-6",
  containerSm: "mx-auto max-w-4xl px-6",
  section: "py-24 md:py-32",
  sectionWhite: "bg-white py-24 md:py-32",
} as const;

export const typography = {
  heroTitle: "text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl",
  sectionTitle: "text-4xl font-bold tracking-tight md:text-5xl",
  sectionTitleSm: "text-3xl font-bold md:text-4xl",
  pageTitle: "text-3xl font-bold tracking-tight",
  pageTitleLg: "text-4xl font-bold tracking-tight md:text-5xl",
  bodyLg: "text-lg leading-relaxed text-muted md:text-xl",
  body: "text-sm leading-relaxed text-muted",
  label: "text-sm font-medium",
  caption: "text-xs text-muted",
  monoStat: "font-mono text-3xl font-bold",
  monoStatLg: "font-mono text-5xl font-bold",
  scoreHero: "text-7xl font-bold tracking-tight md:text-8xl",
  scoreCompact: "text-5xl font-bold tracking-tight",
} as const;

export const surfaces = {
  card: "card-surface",
  cardPadded: "card-surface p-6",
  cardPaddedLg: "card-surface p-8 md:p-12",
  cardAuth: "card-surface w-full max-w-md p-8",
  cardHover:
    "card-surface block p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]",
  input:
    "w-full rounded-[14px] border border-border px-4 py-3 text-sm outline-none focus:border-accent",
  inputInline:
    "flex-1 rounded-[14px] border border-border px-4 py-3 text-sm outline-none focus:border-accent",
  codeBlock: "rounded-[14px] border border-border bg-[#FAFAFA] px-4 py-3 font-mono text-sm",
  codeBlockSm: "mt-3 block rounded-[14px] bg-[#FAFAFA] px-4 py-3 font-mono text-xs",
  positivePanel: "rounded-[20px] bg-accent-soft p-5",
  negativePanel: "rounded-[20px] border border-border bg-white p-5",
  claimBanner: "rounded-[20px] bg-accent-soft p-6 md:flex md:items-center md:justify-between",
  stepCard: "rounded-[24px] border border-border p-8",
  pricingFeatured: "rounded-[20px] bg-teal text-white shadow-[0_12px_30px_rgba(15,110,104,0.2)] p-8",
  pricingDefault: "rounded-[20px] card-surface p-8",
  ctaBanner:
    "relative overflow-hidden rounded-[28px] bg-[#111111] px-8 py-16 text-center text-white md:px-16",
} as const;

export const nav = {
  header: "fixed top-6 left-0 right-0 z-50 px-5 md:px-8",
  bar: "mx-auto flex max-w-5xl items-center justify-between rounded-[20px] border border-border bg-white px-5 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.04)]",
  link: "text-sm font-medium text-[#666666] transition-colors hover:text-[#111111]",
  cta: "rounded-[14px] bg-accent px-5 py-2.5 text-sm font-medium text-[#111111] shadow-[0_10px_20px_rgba(123,225,59,0.25)] transition hover:bg-accent-hover",
} as const;

export const buttons = {
  base: "inline-flex items-center justify-center rounded-[14px] px-7 py-3.5 text-sm font-medium transition-all duration-200",
  primary:
    "bg-accent text-[#111111] shadow-[0_10px_20px_rgba(123,225,59,0.25)] hover:bg-accent-hover",
  secondary: "bg-[#111111] text-white hover:bg-[#222222]",
  ghost: "bg-transparent border border-border text-[#666666] hover:bg-white",
  ghostOnDark: "border-white/20 text-white hover:bg-white/10",
  disabled: "opacity-60 pointer-events-none",
  fullWidth: "w-full",
} as const;

export const pills = {
  verified: "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-accent-soft text-[#2d5016]",
  default:
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-[#F5F5F5] text-muted border border-border",
  stepActive: "rounded-full px-3 py-1 text-xs font-medium bg-accent-soft text-[#2d5016]",
  stepInactive: "rounded-full px-3 py-1 text-xs font-medium bg-white border border-border text-muted",
  capability: "rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-[#2d5016]",
} as const;

export const effects = {
  gridBg: "absolute inset-0 grid-bg opacity-60",
  glowGreen: "absolute inset-x-0 top-0 h-[480px] glow-green",
  glowGreenOverlay: "absolute inset-0 glow-green opacity-40",
  scoreAnimate: "score-animate",
} as const;

export const links = {
  inline: "font-medium text-[#111111] hover:underline",
  inlineUnderline: "font-medium text-[#111111] underline-offset-4 hover:underline",
  muted: "hover:underline",
} as const;

export const states = {
  loading: "flex min-h-screen items-center justify-center text-muted",
  error: "text-sm text-red-600",
} as const;
