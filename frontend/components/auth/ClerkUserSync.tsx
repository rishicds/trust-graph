"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { routes } from "@/constants";
import { syncAccount } from "@/lib/sync-account";

const AUTH_PAGES = new Set([routes.signIn, routes.signUp, routes.signup, "/signup"]);

function onboardingDestination(user: NonNullable<Awaited<ReturnType<typeof syncAccount>>["user"]>, profileStep: number) {
  if (user.account_type === "recruiter") {
    return user.recruiter_onboarding_complete ? routes.recruiterDashboard : routes.recruiterOnboarding;
  }
  if (!user.account_type || (user.account_type === "passport" && !user.professional_segment && profileStep < 2)) {
    return routes.onboarding;
  }
  return profileStep < 5 ? routes.onboarding : routes.dashboard;
}

export function ClerkUserSync() {
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const synced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || synced.current) return;

    async function sync() {
      const claimHandle = searchParams.get("claim") ?? undefined;
      try {
        const result = await syncAccount(getToken, claimHandle);
        synced.current = true;

        const user = result.user;
        const profileStep = result.profile?.onboarding_step ?? 0;
        const destination = user
          ? onboardingDestination(user, profileStep)
          : profileStep < 5
            ? routes.onboarding
            : routes.dashboard;

        if (AUTH_PAGES.has(pathname)) {
          router.replace(destination);
          return;
        }

        if (pathname === routes.home) {
          if (destination !== routes.dashboard) {
            router.replace(destination);
          }
        }
      } catch {
        // Pages that need the backend account will surface their own retry UI.
      }
    }

    void sync();
  }, [isSignedIn, getToken, pathname, router, searchParams]);

  return null;
}
