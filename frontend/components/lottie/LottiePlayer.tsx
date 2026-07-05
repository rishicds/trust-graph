"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

type LottiePlayerProps = {
  src: string;
  loop?: boolean;
  playOnVisible?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function LottiePlayer({
  src,
  loop = false,
  playOnVisible = false,
  className,
  style,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [shouldLoad, setShouldLoad] = useState(!playOnVisible);

  useEffect(() => {
    if (!playOnVisible) return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "100px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [playOnVisible]);

  useEffect(() => {
    if (!shouldLoad || !containerRef.current) return;

    let cancelled = false;

    void import("lottie-web").then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return;

      animRef.current?.destroy();
      animRef.current = null;
      containerRef.current.innerHTML = "";

      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay: true,
        path: src,
      });

      if (!loop) {
        const holdLastFrame = () => {
          anim.goToAndStop(Math.max(anim.totalFrames - 1, 0), true);
        };
        anim.addEventListener("complete", holdLastFrame);
        anim.addEventListener("loopComplete", holdLastFrame);
      }

      animRef.current = anim;
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [shouldLoad, src, loop]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      aria-hidden
    />
  );
}
