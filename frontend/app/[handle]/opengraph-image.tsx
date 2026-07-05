import { ImageResponse } from "next/og";

import { reservedHandles } from "@/constants";
import { api } from "@/lib/api";
import { passportDisplayUrl } from "@/lib/app-url";

export const alt = "TrustGraph Passport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type PageProps = {
  params: Promise<{ handle: string }>;
};

function topCapability(profile: Awaited<ReturnType<typeof api.getProfile>>) {
  if (!profile.capabilities.length) return null;
  return [...profile.capabilities].sort((a, b) => b.evidence_count - a.evidence_count)[0];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

async function loadAvatarSrc(avatarUrl?: string) {
  if (!avatarUrl) return undefined;
  try {
    const response = await fetch(avatarUrl, { next: { revalidate: 86400 } });
    if (!response.ok) return avatarUrl;
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return avatarUrl;
  }
}

function TrustGraphCard({
  name,
  handle,
  score,
  evidenceCount,
  topCap,
  avatarUrl,
  tagline,
}: {
  name: string;
  handle: string;
  score?: number;
  evidenceCount?: number;
  topCap?: string;
  avatarUrl?: string;
  tagline: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #F5F5F5 0%, #EAF8DD 55%, #DFF5F1 100%)",
        padding: "56px 64px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#111111",
            letterSpacing: "-0.02em",
          }}
        >
          Trust<span style={{ color: "#0F6E68" }}>Graph</span>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F6E68",
            background: "#FFFFFF",
            border: "1px solid #EAEAEA",
            borderRadius: 999,
            padding: "6px 14px",
          }}
        >
          Trust Passport
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 40 }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            width={140}
            height={140}
            style={{
              borderRadius: 28,
              border: "4px solid #FFFFFF",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 140,
              height: 140,
              borderRadius: 28,
              background: "#0F6E68",
              color: "#FFFFFF",
              fontSize: 48,
              fontWeight: 700,
              border: "4px solid #FFFFFF",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            }}
          >
            {initials(name)}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 22, color: "#777777", lineHeight: 1.4 }}>{tagline}</div>
          {score !== undefined && (
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  background: "#FFFFFF",
                  border: "1px solid #EAEAEA",
                  borderRadius: 20,
                  padding: "14px 22px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ fontSize: 18, color: "#777777", fontWeight: 600 }}>Trust Score</span>
                <span style={{ fontSize: 40, fontWeight: 800, color: "#0F6E68" }}>
                  {score.toFixed(0)}
                </span>
                <span style={{ fontSize: 20, color: "#A3A3A3" }}>/100</span>
              </div>
              {evidenceCount !== undefined && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#FFFFFF",
                    border: "1px solid #EAEAEA",
                    borderRadius: 20,
                    padding: "14px 22px",
                    fontSize: 18,
                    color: "#777777",
                    fontWeight: 600,
                  }}
                >
                  {evidenceCount} evidence signals
                </div>
              )}
            </div>
          )}
          {topCap && (
            <div style={{ fontSize: 18, color: "#0F6E68", fontWeight: 600 }}>
              Top capability: {topCap}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid rgba(17,17,17,0.08)",
        }}
      >
        <div style={{ fontSize: 20, color: "#777777", fontWeight: 500 }}>
          {passportDisplayUrl(handle)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#7BE13B",
            color: "#111111",
            fontSize: 18,
            fontWeight: 700,
            borderRadius: 14,
            padding: "12px 24px",
            boxShadow: "0 10px 20px rgba(123,225,59,0.25)",
          }}
        >
          Claim your Trust Passport →
        </div>
      </div>
    </div>
  );
}

export default async function Image({ params }: PageProps) {
  const { handle } = await params;

  if (reservedHandles.has(handle.toLowerCase())) {
    return new ImageResponse(
      <TrustGraphCard
        name="TrustGraph"
        handle={handle}
        tagline="Portable, evidence-backed reputation for builders."
      />,
      { ...size },
    );
  }

  try {
    const profile = await api.getProfile(handle);
    const cap = topCapability(profile);
    const tagline =
      profile.headline && profile.headline.length <= 90
        ? profile.headline
        : profile.is_shadow && !profile.is_claimed
          ? "Evidence-backed shadow profile — verify GitHub to claim yours free."
          : "One link answers: can I trust this person? Proof over claims.";
    const avatarSrc = await loadAvatarSrc(profile.avatar_url);

    return new ImageResponse(
      <TrustGraphCard
        name={profile.display_name}
        handle={profile.handle}
        score={profile.trust_score.overall}
        evidenceCount={profile.evidence_count}
        topCap={cap?.name}
        avatarUrl={avatarSrc}
        tagline={tagline}
      />,
      { ...size },
    );
  } catch {
    return new ImageResponse(
      <TrustGraphCard
        name={handle}
        handle={handle}
        tagline="Evidence-backed Trust Passport on TrustGraph."
      />,
      { ...size },
    );
  }
}
