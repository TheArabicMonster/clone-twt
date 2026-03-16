import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/suggestions
// Retourne jusqu'à 10 utilisateurs que l'utilisateur connecté pourrait vouloir
// contacter, mais avec qui il n'a pas encore de conversation.
// Candidats : union dédupliquée de (follows + followers), sans conversation existante.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Étape 1 : IDs des utilisateurs que currentUser suit
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    // Étape 2 : IDs des utilisateurs qui suivent currentUser
    const followers = await prisma.follow.findMany({
      where: { followingId: currentUserId },
      select: { followerId: true },
    });

    // Étape 3 : Union dédupliquée, en excluant currentUserId
    const followingIds = following.map((f) => f.followingId);
    const followerIds = followers.map((f) => f.followerId);
    const candidateIds = [
      ...new Set([...followingIds, ...followerIds]),
    ].filter((id) => id !== currentUserId);

    if (candidateIds.length === 0) {
      return NextResponse.json([]);
    }

    // Étape 4 : IDs des interlocuteurs avec qui une conversation existe déjà
    const existingConversations = await prisma.conversation.findMany({
      where: { participantIds: { has: currentUserId } },
      select: { participantIds: true },
    });

    const existingInterlocutorIds = new Set(
      existingConversations.flatMap((c) =>
        c.participantIds.filter((id) => id !== currentUserId)
      )
    );

    // Étape 5 : Garder uniquement les candidats sans conversation existante
    const suggestedIds = candidateIds.filter(
      (id) => !existingInterlocutorIds.has(id)
    );

    if (suggestedIds.length === 0) {
      return NextResponse.json([]);
    }

    // Étape 6 : Récupérer les données utilisateur pour les candidats retenus
    const users = await prisma.user.findMany({
      where: { id: { in: suggestedIds } },
      select: {
        id: true,
        username: true,
        pseudo: true,
        image: true,
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[GET /api/users/suggestions]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
