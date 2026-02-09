"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";
import Link from "next/link";
import { signIn } from "next-auth/react";

// Schéma de validation
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess(
        "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
      );
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        return;
      }

      // Rediriger vers la page d'accueil
      router.push("/");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">Se connecter</h1>
          <p className="text-sm text-default-500">
            Connectez-vous à votre compte Twitter Clone
          </p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-success-50 p-3 text-sm text-success">
                {success}
              </div>
            )}

            <Input
              {...register("email")}
              type="email"
              label="Email"
              placeholder="john@example.com"
              variant="bordered"
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
            />

            <Input
              {...register("password")}
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              variant="bordered"
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
            />

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Se connecter
            </Button>

            <p className="text-center text-sm text-default-500">
              Vous n&apos;avez pas de compte ?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                S&apos;inscrire
              </Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
