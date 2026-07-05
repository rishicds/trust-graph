"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

import { navigation, routes } from "@/constants";

export function LandingAuthNav() {
  return (
    <div className="flex min-w-0 shrink items-center gap-3 sm:gap-4">
      <Show when="signed-out">
        <SignInButton mode="redirect" forceRedirectUrl={routes.dashboard}>
          <button
            type="button"
            className="hidden text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:inline"
          >
            {navigation.login}
          </button>
        </SignInButton>
        <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
        <Link
          href={routes.signUp}
          className="inline-flex shrink-0 items-center gap-1 rounded-[14px] bg-accent px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--shadow-green)] transition hover:bg-accent-hover sm:px-4 sm:py-2 sm:text-sm"
        >
          Claim passport
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </Show>
      <Show when="signed-in">
        <Link
          href={routes.dashboard}
          className="hidden text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:inline"
        >
          Dashboard
        </Link>
        <UserButton />
      </Show>
    </div>
  );
}
