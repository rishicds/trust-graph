"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import { gsap, ScrollTrigger } from "@/lib/gsap";

export function LandingSectionMotion({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".section-label").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 85%" },
          opacity: 0,
          y: 10,
          duration: 0.4,
          ease: "power2.out",
        });
      });

      gsap.utils.toArray<HTMLElement>(".section-title").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 82%" },
          opacity: 0,
          y: 20,
          duration: 0.55,
          ease: "power2.out",
          delay: 0.05,
        });
      });

      const problemGrid = ref.current?.querySelector(".problem-grid");
      if (problemGrid) {
        gsap.from(".problem-card", {
          scrollTrigger: { trigger: problemGrid, start: "top 75%" },
          y: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 0.55,
          ease: "power2.out",
        });
      }

      ScrollTrigger.refresh();
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
