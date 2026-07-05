import type { Metadata } from "next";

import { meta } from "@/constants";
import type { Capability, PublicProfile } from "@/lib/api";
import { appBaseUrl, passportFullUrl } from "@/lib/app-url";

function topCapability(capabilities: Capability[]): string | undefined {
  if (!capabilities.length) return undefined;
  return [...capabilities].sort((a, b) => b.evidence_count - a.evidence_count)[0]?.name;
}

function profileImages(profile: PublicProfile, ogImage: string) {
  const images: NonNullable<Metadata["openGraph"]>["images"] = [
    {
      url: ogImage,
      width: 1200,
      height: 630,
      alt: `${profile.display_name} — TrustGraph Passport`,
    },
  ];

  if (profile.avatar_url) {
    images.push({
      url: profile.avatar_url,
      width: 400,
      height: 400,
      alt: `${profile.display_name} profile photo`,
    });
  }

  return images;
}

export function buildProfileMetadata(profile: PublicProfile): Metadata {
  const url = passportFullUrl(profile.handle);
  const score = profile.trust_score.overall;
  const top = topCapability(profile.capabilities);
  const ogTitle = meta.profileOgTitle(profile.display_name, score);
  const ogDescription = meta.profileOgDescription({
    displayName: profile.display_name,
    score,
    evidenceCount: profile.evidence_count,
    topCapability: top,
    isShadow: profile.is_shadow && !profile.is_claimed,
    headline: profile.headline,
  });
  const ogImage = `${appBaseUrl()}/${profile.handle}/opengraph-image`;

  return {
    title: meta.profileTitle(profile.display_name),
    description: ogDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title: ogTitle,
      description: ogDescription,
      siteName: "TrustGraph",
      images: profileImages(profile, ogImage),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export function buildProfileFallbackMetadata(handle: string): Metadata {
  const url = passportFullUrl(handle);
  const ogImage = `${appBaseUrl()}/${handle}/opengraph-image`;

  return {
    title: meta.profileFallbackTitle,
    description: meta.profileFallbackDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: meta.profileFallbackTitle,
      description: meta.profileFallbackDescription,
      siteName: "TrustGraph",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "TrustGraph Passport" }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.profileFallbackTitle,
      description: meta.profileFallbackDescription,
      images: [ogImage],
    },
  };
}
