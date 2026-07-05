import Image from "next/image";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: 40,
  md: 64,
  lg: 96,
  xl: 128,
} as const;

const SIZE_CLASSES = {
  sm: "h-10 w-10 min-h-10 min-w-10",
  md: "h-16 w-16 min-h-16 min-w-16",
  lg: "h-24 w-24 min-h-24 min-w-24",
  xl: "h-32 w-32 min-h-32 min-w-32",
} as const;

type ProfileAvatarProps = {
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
};

export function profileAvatarUrl(handle: string, avatarUrl?: string) {
  if (avatarUrl?.trim()) return avatarUrl;
  return `https://api.dicebear.com/9.x/fun-emoji/png?seed=${encodeURIComponent(handle || "trustgraph")}&size=256`;
}

export function ProfileAvatar({
  handle,
  displayName,
  avatarUrl,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const px = SIZES[size];
  const src = profileAvatarUrl(handle, avatarUrl);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl border border-border bg-accent-soft shadow-sm",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <Image
        src={src}
        alt={displayName ? `${displayName} avatar` : `${handle} avatar`}
        width={px}
        height={px}
        className="h-full w-full object-cover object-center"
        unoptimized={src.includes("dicebear.com")}
      />
    </div>
  );
}
