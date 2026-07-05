import Link from "next/link";

import { Navbar } from "@/components/layout/Navbar";
import { footer, routes } from "@/constants";
import { sampleProfileHandle } from "@/constants/brand";
import { layout, links, surfaces, typography } from "@/constants/styles";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata = {
  title: "API & Badges — TrustGraph",
  description: "GitHub README badges, embed widgets, and trust score API reference.",
};

export default function DocsPage() {
  const handle = "yourhandle";
  const badgeMd = `[![TrustGraph](${API_BASE}/badge/${handle}.svg)](${APP_BASE}/${handle})`;
  const embedHtml = `<iframe src="${API_BASE}/embed/${handle}" width="360" height="220" frameborder="0" title="TrustGraph profile"></iframe>`;

  return (
    <>
      <Navbar />
      <main className={`${layout.pageWithNav} max-w-3xl`}>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Developers</p>
        <h1 className={`mt-2 ${typography.pageTitleLg}`}>API &amp; badges</h1>
        <p className="mt-4 text-muted">
          Phase 1 reference for README badges, embed widgets, and the trust score API. Full doc:{" "}
          <code className="font-mono text-sm">docs/BADGES_AND_API.md</code>
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">GitHub README badge</h2>
          <p className="mt-2 text-sm text-muted">
            Dynamic SVG — updates when your score changes. Primary viral surface per the PRD.
          </p>
          <img
            src={`${API_BASE}/badge/${sampleProfileHandle}.svg`}
            alt="TrustGraph badge example"
            className="mt-4 h-7"
          />
          <pre className={`mt-4 overflow-x-auto ${surfaces.codeBlock}`}>{badgeMd}</pre>
          <p className="mt-3 text-sm text-muted">
            Copy from your <Link href={routes.dashboard} className={links.inline}>dashboard</Link> after
            onboarding.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Embed widget</h2>
          <p className="mt-2 text-sm text-muted">HTML card for personal sites and portfolios.</p>
          <pre className={`mt-4 overflow-x-auto ${surfaces.codeBlock}`}>{embedHtml}</pre>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Trust score API</h2>
          <pre className={`mt-4 overflow-x-auto ${surfaces.codeBlock}`}>
            {`GET ${API_BASE}/v1/trust-score?handle={username}&mode=band

Modes: band · binary · full
Header: X-API-Key (optional, Pro tier)`}
          </pre>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Job application evidence</h2>
          <p className="mt-2 text-sm text-muted">
            Add Workable application URLs during onboarding as verified evidence. Example:
          </p>
          <dl className={`mt-4 space-y-3 text-sm ${surfaces.cardPadded}`}>
            <div>
              <dt className="font-semibold text-muted">Title</dt>
              <dd>Ad Tech, Machine Learning Engineer — Marketplace</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">URL</dt>
              <dd>
                <a
                  href="https://apply.workable.com/mercari/j/E1C4662691"
                  className={links.inline}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  apply.workable.com/mercari/j/E1C4662691
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <p className="mt-12 text-sm text-muted">
          {footer.developersHeading}:{" "}
          <Link href={routes.signUp} className={links.inline}>
            Get started
          </Link>
        </p>
      </main>
    </>
  );
}
