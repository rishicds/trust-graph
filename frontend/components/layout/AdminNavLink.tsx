"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { routes } from "@/constants";
import { nav as navStyles } from "@/constants/styles";
import { api } from "@/lib/api";

export function AdminNavLink() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    async function check() {
      const token = await getToken();
      if (!token || cancelled) return;
      try {
        const res = await api.adminMe(token);
        if (!cancelled) setIsAdmin(res.admin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  if (!isAdmin) return null;

  return (
    <Link href={routes.admin} className={navStyles.link}>
      Admin
    </Link>
  );
}
