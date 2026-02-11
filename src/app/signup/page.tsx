"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";
import Link from "next/link";

// Schéma de validation
const signUpSchema = z
  .object({
    email: z.string().email("Email invalide"),
    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(20, "Maximum 20 caractères")
      .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et underscores uniquement"),
    pseudo: z.string().min(1, "Le pseudo est requis"),
    password: z.string().min(3, "Minimum 3 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          pseudo: data.pseudo,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Une erreur est survenue");
        return;
      }

      // Rediriger vers la page de connexion
      router.push("/login?registered=true");
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
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-sm text-default-500">
            Rejoignez Twitter Clone dès aujourd&apos;hui
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

            <Input
              {...register("pseudo")}
              label="Pseudo"
              placeholder="JohnDoe"
              variant="bordered"
              isInvalid={!!errors.pseudo}
              errorMessage={errors.pseudo?.message}
            />

            <Input
              {...register("username")}
              label="Nom d'utilisateur"
              placeholder="johndoe"
              variant="bordered"
              isInvalid={!!errors.username}
              errorMessage={errors.username?.message}
            />

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

            <Input
              {...register("confirmPassword")}
              type="password"
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              variant="bordered"
              isInvalid={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              S&apos;inscrire
            </Button>

            <p className="text-center text-sm text-default-500">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
