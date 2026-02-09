import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schéma de validation avec Zod
const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(20, "Le nom d'utilisateur ne peut pas dépasser 20 caractères")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
    ),
  name: z.string().min(1, "Le nom est requis"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
    ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation des données
    const validatedData = registerSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 },
      );
    }

    // Vérifier si le username existe déjà
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà pris" },
        { status: 400 },
      );
    }

    // Hasher le mot de passe
    const hashedPass = await bcrypt.hash(validatedData.password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        name: validatedData.name,
        hashedPassword: hashedPass,
      },
    });

    // Retourner l'utilisateur (sans le mot de passe)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: userWithoutPassword,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 },
    );
  }
}
