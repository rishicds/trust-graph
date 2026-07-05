import Link from "next/link";

import { NewsletterSignup } from "@/components/layout/NewsletterSignup";
import { footerContent } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white pt-16 pb-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-8 md:grid-cols-[1.8fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <p className="text-lg font-bold text-[var(--text-primary)]">
            Trust<span className="text-teal">Graph</span>
          </p>
          <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-[var(--text-secondary)]">
            {footerContent.tagline}
          </p>
          <NewsletterSignup />
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Product
          </p>
          <ul>
            {footerContent.productLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block py-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Developers
          </p>
          <ul>
            {footerContent.developerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block py-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Company
          </p>
          <ul>
            {footerContent.companyLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block py-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-border px-8 pt-6 sm:flex-row">
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} TrustGraph. All rights reserved.
        </p>
        <div className="flex flex-wrap gap-2">
          {footerContent.pills.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-border px-3 py-1 text-xs text-[var(--text-muted)]"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
