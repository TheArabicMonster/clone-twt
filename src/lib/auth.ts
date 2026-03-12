import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 12, // validité du token -> 12h
    },
    providers: [
    Credentials({
        name: "credentials",
        credentials: { //champs requis pour la connexion
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        //Vérifie que les creds soient valides et retourne les infos du user
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email et mot de passe requis");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string,
            },
          });

          if (!user || !user.hashedPassword) {
            throw new Error("Identifiants invalides");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword,
          );

          if (!isPasswordValid) {
            throw new Error("Identifiants invalides");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.pseudo,
            image: user.image,
            username: user.username,
            pseudo: user.pseudo,
            bio: user.bio,
          };
        },
      }),
  ],
});
