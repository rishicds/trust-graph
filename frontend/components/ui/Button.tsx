import Link from "next/link";
import { ReactNode } from "react";
import { buttons } from "@/constants/styles";

type ButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "ghostOnDark";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variants = {
  primary: buttons.primary,
  secondary: buttons.secondary,
  ghost: buttons.ghost,
  ghostOnDark: buttons.ghostOnDark,
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const classes = `${buttons.base} ${variants[variant]} ${className} ${disabled ? buttons.disabled : ""}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
