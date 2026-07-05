"use client";

import type { ComponentType } from "react";
import { ExternalLink, Globe, Link2, Mail } from "lucide-react";

import { profile as profileCopy } from "@/constants";
import { cn } from "@/lib/utils";

export type SocialLink = {
  platform: string;
  url: string;
};

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const PLATFORMS: {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "website", label: "Website", icon: Globe },
  { id: "twitter", label: "X", icon: Link2 },
  { id: "linkedin", label: "LinkedIn", icon: Link2 },
  { id: "github", label: "GitHub", icon: GitHubIcon },
];

function linkForPlatform(links: SocialLink[], platform: string) {
  return links.find((l) => l.platform === platform)?.url ?? "";
}

export function ProfileSocialLinks({
  links,
  githubEmail,
  className,
  compact = false,
  prominent = false,
}: {
  links?: SocialLink[];
  githubEmail?: string;
  className?: string;
  compact?: boolean;
  prominent?: boolean;
}) {
  const items = links ?? [];
  const email = githubEmail?.trim() ?? "";
  if (items.length === 0 && !email) return null;

  const connected = PLATFORMS.filter((p) => linkForPlatform(items, p.id));

  if (connected.length === 0 && !email) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center",
        prominent ? "gap-2.5" : "gap-2",
        className,
      )}
      role="group"
      aria-label={profileCopy.social.title}
    >
      {!compact && !prominent && (
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted">
          {profileCopy.social.title}
        </span>
      )}
      {prominent && (
        <span className="w-full text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          {profileCopy.social.title}
        </span>
      )}
      {PLATFORMS.map((platform) => {
        const url = linkForPlatform(items, platform.id);
        const active = Boolean(url);

        if (!active && compact) return null;

        const Icon = platform.icon;

        if (!active) {
          return (
            <span
              key={platform.id}
              className={cn(
                "inline-flex items-center rounded-full border border-border bg-[#F5F5F5] text-muted",
                prominent ? "gap-2 px-4 py-2.5 text-sm font-medium" : "px-3.5 py-1.5 text-xs font-medium",
              )}
              aria-label={`${platform.label} not linked`}
            >
              {platform.label}
            </span>
          );
        }

        return (
          <a
            key={platform.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${platform.label}`}
            className={cn(
              "group inline-flex items-center border font-semibold transition",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
              prominent
                ? "min-h-11 gap-2 rounded-lg border-teal/35 bg-white px-4 py-2.5 text-sm text-[#111111] shadow-sm hover:-translate-y-0.5 hover:border-teal hover:bg-teal hover:text-white hover:shadow-md active:translate-y-0"
                : "rounded-full border-teal/30 bg-teal-light px-3.5 py-1.5 text-xs text-teal hover:border-teal hover:bg-teal hover:text-white",
            )}
          >
            <Icon
              className={cn(
                "shrink-0",
                prominent ? "h-4 w-4 text-teal group-hover:text-white" : "hidden",
              )}
            />
            <span>{platform.label}</span>
            <ExternalLink
              className={cn(
                "shrink-0 opacity-70 transition group-hover:opacity-100",
                prominent ? "h-3.5 w-3.5" : "ml-1.5 h-3 w-3",
              )}
            />
          </a>
        );
      })}
      {email && (
        <a
          href={`mailto:${email}`}
          title={`Email ${email}`}
          className={cn(
            "group inline-flex items-center border font-semibold transition",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
            prominent
              ? "min-h-11 max-w-full gap-2 rounded-lg border-teal/35 bg-white px-4 py-2.5 text-sm text-[#111111] shadow-sm hover:-translate-y-0.5 hover:border-teal hover:bg-teal hover:text-white hover:shadow-md active:translate-y-0"
              : "max-w-full rounded-full border-teal/30 bg-teal-light px-3.5 py-1.5 text-xs text-teal hover:border-teal hover:bg-teal hover:text-white",
          )}
        >
          <Mail
            className={cn(
              "shrink-0",
              prominent ? "h-4 w-4 text-teal group-hover:text-white" : "h-3 w-3",
            )}
          />
          <span className="truncate">{email}</span>
        </a>
      )}
      {!compact && !prominent && connected.length === 0 && (
        <span className="text-xs text-muted">{profileCopy.social.empty}</span>
      )}
    </div>
  );
}

export function socialLinksFromPreview(links?: SocialLink[]) {
  return links ?? [];
}
