import { ReactNode } from "react";
import { pills, surfaces } from "@/constants/styles";

export function Card({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] p-7 ${
        dark ? "bg-teal text-white border border-teal" : surfaces.card
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children, verified = false }: { children: ReactNode; verified?: boolean }) {
  return (
    <span className={verified ? pills.verified : pills.default}>
      {children}
    </span>
  );
}
