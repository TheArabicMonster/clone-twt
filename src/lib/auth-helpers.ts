import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Protège une route côté serveur
 * Redirige vers /login si l'utilisateur n'est pas connecté
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Vérifie si l'utilisateur est connecté
 * Redirige vers /profile/[username] si l'utilisateur est déjà connecté (pour les pages login/signup)
 */
export async function requireGuest() {
  const session = await auth();

  if (session?.user) {
    redirect(`/profile/${session.user.username}`);
  }

  return null;
}

/**
 * Récupère la session utilisateur (optionnel)
 */
export async function getSession() {
  return await auth();
}
