"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

import { ScrollTrigger } from "@/lib/gsap";

const MOBILE_MAX_WIDTH = 767;

function shouldEnableSmoothScroll() {
  if (typeof window === "undefined") return false;
  if (window.innerWidth <= MOBILE_MAX_WIDTH) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    let lenis: Lenis | null = null;

    const teardown = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped");
      lenis?.destroy();
      lenis = null;
      lenisRef.current = null;
    };

    const setup = () => {
      if (!shouldEnableSmoothScroll()) {
        teardown();
        ScrollTrigger.refresh();
        return;
      }
      if (lenis) return;

      document.documentElement.classList.add("lenis", "lenis-smooth");
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisRef.current = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      const raf = (time: number) => {
        lenis?.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      };
      rafRef.current = requestAnimationFrame(raf);
      ScrollTrigger.refresh();
    };

    setup();
    window.addEventListener("resize", setup);

    return () => {
      window.removeEventListener("resize", setup);
      teardown();
    };
  }, []);

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return children;
}
