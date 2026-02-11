import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
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
          pseudo: user.pseudo,
          image: user.image,
          username: user.username,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username as string;
        token.pseudo = user.pseudo as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.pseudo = token.pseudo as string;
      }
      return session;
    },
  },
};
