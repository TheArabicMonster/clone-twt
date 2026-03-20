"use client";

import { Avatar } from "@heroui/react";

type ProfileAvatarProps = {
  src?: string | null;
  className?: string;
};

export default function ProfileAvatar({
  src,
  className,
}: ProfileAvatarProps) {
  return (
    <Avatar
      src={src || undefined}
      className={className}
      showFallback
    />
  );
}