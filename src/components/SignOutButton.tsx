"use client";

import { signOut } from "next-auth/react";
import { Button } from "@heroui/button";

export function SignOutButton() {
  return (
    <Button
      color="danger"
      variant="flat"
      onPress={() => signOut({ callbackUrl: "/login" })}
    >
      Se déconnecter
    </Button>
  );
}
