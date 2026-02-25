import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        const currentUserId = session.user.id;

        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                OR: [
                    { pseudo: { contains: query, mode: "insensitive" } },
                    { username: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                pseudo: true,
                username: true,
                image: true,
            },
            take: 10,
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Erreur recherche utilisateurs:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue" },
            { status: 500 },
        );
    }
}
