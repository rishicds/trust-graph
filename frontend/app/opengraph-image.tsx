import { ImageResponse } from "next/og";

import { appHost } from "@/lib/app-url";

export const alt = "TrustGraph — The Trust Layer of the Internet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #F5F5F5 0%, #EAF8DD 50%, #DFF5F1 100%)",
          padding: "56px 64px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-0.02em",
            }}
          >
            <div>Trust</div>
            <div style={{ color: "#0F6E68" }}>Graph</div>
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
            Now in early access
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, gap: 48, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 64,
                fontWeight: 800,
                color: "#111111",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              <div>Your reputation,</div>
              <div>finally portable.</div>
            </div>
            <div style={{ fontSize: 24, color: "#777777", lineHeight: 1.45, maxWidth: 620 }}>
              {"One link that answers: can I trust this person? Evidence from GitHub, Stack Overflow, Devpost and more — not claims."}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#FFFFFF",
                  color: "#777777",
                  border: "1px solid #EAEAEA",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                4,200+ profiles
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#FFFFFF",
                  color: "#777777",
                  border: "1px solid #EAEAEA",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {"<60s to score"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#7BE13B",
                  color: "#111111",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: "0 10px 20px rgba(123,225,59,0.25)",
                }}
              >
                Free forever
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 340,
              background: "#FFFFFF",
              border: "1px solid #EAEAEA",
              borderRadius: 28,
              padding: "28px 28px 24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F6E68", marginBottom: 16 }}>
              TRUST PASSPORT
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "#0F6E68",
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                TG
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111111" }}>you</div>
                <div style={{ fontSize: 14, color: "#A3A3A3" }}>{`${appHost()}/you`}</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                background: "#DFF5F1",
                borderRadius: 16,
                padding: "16px 18px",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 16, color: "#0F6E68", fontWeight: 600 }}>Trust Score</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#0F6E68" }}>88</div>
              <div style={{ fontSize: 18, color: "#0F6E68" }}>/100</div>
            </div>
            <div style={{ fontSize: 13, color: "#777777", lineHeight: 1.5 }}>
              88 merged PRs · 37 repos · Explainable dimensions · README badge
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 28,
            paddingTop: 24,
            borderTop: "1px solid rgba(17,17,17,0.08)",
          }}
        >
          <div style={{ fontSize: 18, color: "#777777", fontWeight: 500 }}>{appHost()}</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#7BE13B",
              color: "#111111",
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 14,
              padding: "14px 28px",
              boxShadow: "0 10px 20px rgba(123,225,59,0.25)",
            }}
          >
            Claim your passport →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
