import { featuredProfileHandles } from "@/constants/brand";
import { api, GitHubPreview, PublicProfile } from "@/lib/api";

function previewToPublicProfile(preview: GitHubPreview): PublicProfile {
  return {
    handle: preview.handle,
    display_name: preview.display_name,
    headline: preview.headline,
    avatar_url: preview.avatar_url,
    trust_score: preview.trust_score,
    capabilities: preview.capabilities,
    evidence_count: preview.evidence_count,
    active_since: "",
    is_shadow: preview.is_shadow,
    is_claimed: preview.is_claimed,
    view_mode: "teaser",
    stats: preview.stats,
    social_links: preview.social_links,
    github_public_email: preview.github_public_email,
  };
}

export function buildPreviewLines(profile: PublicProfile): string[] {
  const lines: string[] = [];

  if (profile.capabilities.length > 0) {
    lines.push(
      profile.capabilities
        .slice(0, 3)
        .map((cap) => `${cap.name} · ${cap.evidence_count} evidence`)
        .join(" · "),
    );
  }

  if (profile.evidence_count > 0) {
    lines.push(`${profile.evidence_count} evidence items indexed`);
  }

  if (profile.headline) {
    lines.push(profile.headline);
  }

  return lines.slice(0, 3);
}

export async function fetchFeaturedProfiles(): Promise<PublicProfile[]> {
  const results = await Promise.all(
    featuredProfileHandles.map(async (handle) => {
      try {
        return await api.getProfile(handle);
      } catch {
        try {
          const preview = await api.previewGitHub(handle);
          return previewToPublicProfile(preview);
        } catch {
          return null;
        }
      }
    }),
  );

  return results.filter((profile): profile is PublicProfile => profile !== null);
}
