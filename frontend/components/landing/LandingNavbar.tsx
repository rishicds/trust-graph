"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import { LandingAuthNav } from "@/components/landing/LandingAuthNav";
import { routes } from "@/constants";
import { navLinks } from "@/lib/data";
import { gsap } from "@/lib/gsap";

export function LandingNavbar() {
  const navRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".nav-inner", {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.1,
      });
    },
    { scope: navRef },
  );

  return (
    <header className="fixed top-4 left-0 right-0 z-50 w-full max-w-[100vw] px-4 sm:top-6 sm:px-5 md:px-8">
      <nav
        ref={navRef}
        className="nav-inner mx-auto flex h-12 min-w-0 max-w-5xl items-center justify-between gap-2 rounded-[20px] border border-border/80 bg-white/90 px-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:h-14 sm:gap-3 sm:px-5"
      >
        <Link
          href={routes.home}
          className="shrink-0 text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg"
        >
          Trust<span className="text-teal">Graph</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <LandingAuthNav />
      </nav>
    </header>
  );
}
