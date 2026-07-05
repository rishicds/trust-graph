import { appHost, passportDisplayUrl, passportFullUrl } from "@/lib/app-url";

export const brand = {
  name: "TrustGraph",
  tagline: "The trust layer of the internet",
  shortTagline: "Proof over claims · Portable reputation",
  footerTagline: "The trust layer of the internet. Proof over claims. Portable reputation.",
  copyrightSuffix: "Evidence-first. Privacy-safe.",
  /** @deprecated use appHost() — kept for compatibility */
  get domain() {
    return appHost();
  },
  passportUrl: passportDisplayUrl,
  passportFullUrl,
};

export const sampleProfileHandle = "rishicds";

/** Featured on homepage — real GitHub-backed shadow profiles */
export const featuredProfileHandles = [
  "rishicds",
  "pragya79645",
  "rajarshi44",
  "debayudh07",
  "0m4nu4l",
  "neutral-ronnie",
] as const;
