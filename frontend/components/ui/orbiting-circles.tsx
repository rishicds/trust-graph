"use client";

import { Children, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface OrbitingCirclesProps {
  className?: string;
  children: ReactNode;
  radius?: number;
  duration?: number;
  delay?: number;
  reverse?: boolean;
}

export function OrbitingCircles({
  className,
  children,
  radius = 120,
  duration = 20,
  delay = 0,
  reverse = false,
}: OrbitingCirclesProps) {
  const items = Children.toArray(children);
  const count = items.length;

  return (
    <>
      {items.map((child, index) => {
        const angle = (360 / count) * index;
        return (
          <div
            key={index}
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 animate-[orbit_var(--duration)_linear_infinite] transform-gpu",
              reverse && "[animation-direction:reverse]",
              className,
            )}
            style={
              {
                "--duration": `${duration}s`,
                "--radius": `${radius}px`,
                "--angle": angle,
                animationDelay: `${delay}s`,
              } as React.CSSProperties
            }
          >
            {child}
          </div>
        );
      })}
    </>
  );
}
