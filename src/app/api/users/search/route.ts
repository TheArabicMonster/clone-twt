import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/search?q=...
// Recherche des utilisateurs par username ou pseudo (insensible à la casse).
// Exclut l'utilisateur connecté. Limite à 10 résultats.
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length === 0) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { pseudo: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
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
    console.error("[GET /api/users/search]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
