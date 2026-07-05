const DEFAULT_APP_URL = "http://localhost:3000";

/** Public site origin, e.g. http://localhost:3000 or https://trustgraph.com */
export function appBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;
  const withScheme = raw.includes("://") ? raw : `https://${raw}`;
  return withScheme.replace(/\/$/, "");
}

/** Host for display copy, e.g. localhost:3000 or trustgraph.com */
export function appHost(): string {
  try {
    return new URL(appBaseUrl()).host;
  } catch {
    return "localhost:3000";
  }
}

/** Display URL without scheme: localhost:3000/rishicds */
export function passportDisplayUrl(handle: string): string {
  const slug = handle.replace(/^\//, "");
  return `${appHost()}/${slug}`;
}

/** Full shareable URL: http://localhost:3000/rishicds */
export function passportFullUrl(handle: string): string {
  const slug = handle.replace(/^\//, "");
  return `${appBaseUrl()}/${slug}`;
}
