import designSystem from "../design_system.json";

export const ds = designSystem;

export const colors = {
  bgPrimary: ds.colorSystem.background.primary,
  bgSurface: ds.colorSystem.background.surface,
  bgSurfaceSecondary: ds.colorSystem.background.surfaceSecondary,
  textPrimary: ds.colorSystem.text.primary,
  textSecondary: ds.colorSystem.text.secondary,
  textMuted: ds.colorSystem.text.muted,
  accent: ds.colorSystem.accent.primary,
  accentHover: ds.colorSystem.accent.primaryHover,
  accentSoft: ds.colorSystem.accent.primarySoft,
  accentText: "#2d5016",
  accentTextMuted: "#3d6620",
  teal: ds.colorSystem.secondaryAccent.teal,
  tealLight: ds.colorSystem.secondaryAccent.tealLight,
  borderLight: ds.colorSystem.borders.light,
  borderSoft: ds.colorSystem.borders.soft,
  glowGreen: ds.colorSystem.effects.glowGreen,
  glowTeal: ds.colorSystem.effects.glowTeal,
  shadow: ds.colorSystem.effects.shadow,
  navLink: "#666666",
  dark: "#111111",
  darkHover: "#222222",
} as const;

export const shadows = ds.shadowSystem;

export const radii = {
  global: "24px",
  card: "24px",
  cardLg: "28px",
  cardMd: "20px",
  cardSm: "16px",
  button: "14px",
  pill: "999px",
  nav: "20px",
} as const;

export const fonts = {
  sans: ds.typography.fontFamily.primary,
  mono: "JetBrains Mono, ui-monospace, monospace",
} as const;

export const motion = {
  duration: ds.visualLanguage.motionStyle.duration,
  easing: ds.visualLanguage.motionStyle.easing,
  scoreAnimation: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** CSS custom properties — keep in sync with app/globals.css */
export const cssVariables = {
  "--bg-primary": colors.bgPrimary,
  "--bg-surface": colors.bgSurface,
  "--bg-surface-secondary": colors.bgSurfaceSecondary,
  "--text-primary": colors.textPrimary,
  "--text-secondary": colors.textSecondary,
  "--text-muted": colors.textMuted,
  "--accent": colors.accent,
  "--accent-hover": colors.accentHover,
  "--accent-soft": colors.accentSoft,
  "--teal": colors.teal,
  "--teal-light": colors.tealLight,
  "--border-light": colors.borderLight,
  "--border-soft": colors.borderSoft,
  "--glow-green": colors.glowGreen,
  "--glow-teal": colors.glowTeal,
  "--shadow-soft": colors.shadow,
  "--radius-card": radii.card,
  "--radius-button": radii.button,
  "--radius-nav": radii.nav,
} as const;

export const scoreDimensions = [
  { key: "evidence_depth", label: "Evidence Depth", weight: "35%" },
  { key: "consistency", label: "Consistency", weight: "25%" },
  { key: "peer_verification", label: "Peer Verification", weight: "15%" },
  { key: "trust_ratio", label: "Trust Ratio", weight: "25%" },
] as const;
