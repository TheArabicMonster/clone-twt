"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

interface HomeContentProps {
  user: {
    pseudo?: string | null;
    email?: string | null;
    username?: string;
  } | null;
}

export function HomeContent({ user }: HomeContentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Twitter Clone</h1>
          <p className="mt-2 text-lg text-default-500">
            Bienvenue sur votre réseau social
          </p>
        </div>

        {user ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-default-200 p-6">
              <h2 className="text-xl font-semibold">Connecté en tant que :</h2>
              <div className="mt-4 space-y-2">
                <p className="text-lg">
                  <span className="font-medium">Pseudo :</span> {user.pseudo}
                </p>
                <p className="text-lg">
                  <span className="font-medium">Email :</span> {user.email}
                </p>
                <p className="text-lg">
                  <span className="font-medium">Username :</span> @
                  {user.username}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <SignOutButton />
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
