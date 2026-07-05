"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { navigation, routes } from "@/constants";
import { nav as navStyles } from "@/constants/styles";

export function AuthNav() {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <SignInButton mode="redirect" forceRedirectUrl={routes.dashboard}>
          <button type="button" className={`hidden sm:inline ${navStyles.link}`}>
            {navigation.login}
          </button>
        </SignInButton>
        <Link href={routes.signUp} className={navStyles.cta}>
          {navigation.getStarted}
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href={routes.dashboard} className={`hidden sm:inline ${navStyles.link}`}>
          Dashboard
        </Link>
        <Link href={routes.passport} className={`hidden md:inline ${navStyles.link}`}>
          My Passport
        </Link>
        <UserButton />
      </Show>
    </div>
  );
}
