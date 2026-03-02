"use client";
import { Button } from "@heroui/react";
import Link from "next/link";

export default function HomeButtons() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Button
        as={Link}
        href="/signup"
        color="primary"
        size="lg"
        className="w-full sm:w-auto"
      >
        S&apos;inscrire
      </Button>
      <Button
        as={Link}
        href="/login"
        variant="bordered"
        size="lg"
        className="w-full sm:w-auto"
      >
        Se connecter
      </Button>
    </div>
  );
}