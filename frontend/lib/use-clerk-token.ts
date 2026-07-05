"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

export function useClerkToken() {
  const { getToken, isSignedIn } = useAuth();

  return useCallback(async () => {
    if (!isSignedIn) return null;
    return getToken();
  }, [getToken, isSignedIn]);
}
