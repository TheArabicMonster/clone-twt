"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import Link from "next/link";
import { signIn } from "next-auth/react";

// Schéma de validation
const loginSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur est requis"),
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
        username: data.username,
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
      <Card className="w-full max-w-md bg-transparent shadow-none">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">bienvenue sur araTexT</h1>
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
              {...register("username")}
              type="text"
              label="username"
              placeholder="johndoe"
              variant="bordered"
              isInvalid={!!errors.username}
              errorMessage={errors.username?.message}
              classNames={{
                inputWrapper:
                  "!border-white data-[hover=true]:!border-white group-data-[focus=true]:!border-white",
                input: "text-white placeholder:text-gray-400",
              }}
            />

            <Input
              {...register("password")}
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              variant="bordered"
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
              classNames={{
                inputWrapper:
                  "!border-white data-[hover=true]:!border-white group-data-[focus=true]:!border-white",
                input: "text-white placeholder:text-gray-400",
              }}
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
              Pas encore de compte ?{" "}
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
