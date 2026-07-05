import { api } from "@/lib/api";
import { passportFullUrl } from "@/lib/app-url";

export function badgeMarkdown(handle: string): string {
  return `[![TrustGraph](${api.badgeUrl(handle)})](${passportFullUrl(handle)})`;
}

export function embedIframeSnippet(handle: string, height = 220): string {
  return `<iframe src="${api.embedUrl(handle)}" width="360" height="${height}" frameborder="0" title="TrustGraph profile"></iframe>`;
}
