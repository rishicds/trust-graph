import { profile as profileCopy } from "@/constants";
import { PublicProfile, ProfileStat } from "@/lib/api";

const PLATFORM_LABELS: Record<string, string> = {
  github: "GitHub",
  stackoverflow: "Stack Overflow",
  devpost: "Devpost",
  devfolio: "Devfolio",
  linkedin: "LinkedIn",
  portfolio: "Portfolio",
  trustgraph: "TrustGraph",
};

const CATEGORY_LABELS: Record<string, string> = {
  impact: profileCopy.stats.categories.impact,
  contribution: profileCopy.stats.categories.contribution,
  community: profileCopy.stats.categories.community,
  language: profileCopy.stats.categories.language,
  achievement: profileCopy.stats.categories.achievement,
  peer: profileCopy.stats.categories.peer,
  identity: profileCopy.stats.categories.identity,
  claim: profileCopy.stats.categories.claim,
  renown: profileCopy.stats.categories.renown,
};

export function platformLabel(platform: string) {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function groupStatsByPlatform(stats: ProfileStat[]) {
  const groups = new Map<string, ProfileStat[]>();
  for (const stat of stats) {
    if (stat.category === "renown") continue;
    const platform = stat.platform || "other";
    const list = groups.get(platform) ?? [];
    list.push(stat);
    groups.set(platform, list);
  }
  return [...groups.entries()].sort(([a], [b]) => platformOrder(a) - platformOrder(b));
}

function platformOrder(platform: string) {
  const order = ["github", "portfolio", "linkedin", "stackoverflow", "devpost", "devfolio", "trustgraph", "other"];
  const idx = order.indexOf(platform);
  return idx === -1 ? 99 : idx;
}

export function renownStats(stats: ProfileStat[]) {
  return stats.filter((s) => s.category === "renown");
}

export function impactStats(stats: ProfileStat[]) {
  return stats.filter((s) => s.category === "impact");
}

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

export function statsFromProfile(profile: PublicProfile): ProfileStat[] {
  if (profile.stats?.length) return profile.stats;
  return [];
}
