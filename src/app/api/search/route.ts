import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimits } from "@/lib/rate-limit";

// GET /api/search?q=...
// Recherche unifiée : retourne des tweets et des utilisateurs correspondant à la requête.
// Recherche insensible à la casse. Exclut l'utilisateur connecté des résultats users.
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const limited = rateLimits.read(session.user.id, "search:GET");
    if (limited) return limited;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length === 0) {
      return NextResponse.json(
        { error: "Le paramètre de recherche 'q' est obligatoire" },
        { status: 400 }
      );
    }

    const [tweets, users] = await Promise.all([
      prisma.tweet.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
        },
        include: {
          user: true,
          likes: { where: { userId: session.user.id } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),

      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { pseudo: { contains: q, mode: "insensitive" } },
          ],
          AND: [{ id: { not: session.user.id } }],
        },
        select: {
          id: true,
          username: true,
          pseudo: true,
          image: true,
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({ tweets, users });
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
