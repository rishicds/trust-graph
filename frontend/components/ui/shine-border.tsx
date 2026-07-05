"use client";

import { cn } from "@/lib/utils";

type ShineBorderProps = React.HTMLAttributes<HTMLDivElement> & {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
};

export function ShineBorder({
  borderRadius = 20,
  borderWidth = 2,
  duration = 14,
  shineColor = ["#7BE13B", "#0F6E68"],
  className,
  style,
  children,
  ...props
}: ShineBorderProps) {
  const color = Array.isArray(shineColor) ? shineColor.join(",") : shineColor;

  return (
    <div
      className={cn("relative overflow-hidden rounded-[--border-radius]", className)}
      style={
        {
          "--border-radius": `${borderRadius}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] will-change-[background-position] motion-safe:animate-[shine_var(--duration)_linear_infinite]"
        style={
          {
            "--duration": `${duration}s`,
            padding: borderWidth,
            backgroundImage: `radial-gradient(transparent, transparent, ${color}, transparent, transparent)`,
            backgroundSize: "300% 300%",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
          } as React.CSSProperties
        }
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
