import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { id } = await params;
        const tweetId = id;

        // Vérifier si le tweet existe
        const tweet = await prisma.tweet.findUnique({
            where: { id: tweetId },
        });

        if (!tweet) {
            return NextResponse.json(
                { error: "Tweet non trouvé" },
                { status: 404 }
            );
        }

        // Vérifier si le like existe
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_tweetId: {
                    userId: session.user.id,
                    tweetId: tweetId,
                },
            },
        });

        if (existingLike) {
            // Ne plus aimer
            await prisma.like.delete({
                where: {
                    id: existingLike.id,
                },
            });
            return NextResponse.json({ liked: false }, { status: 200 });
        } else {
            // Aimer
            await prisma.like.create({
                data: {
                    userId: session.user.id,
                    tweetId: tweetId,
                },
            });
            return NextResponse.json({ liked: true }, { status: 201 });
        }
    } catch (error) {
        console.error("Erreur toggle like:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue" },
            { status: 500 }
        );
    }
}
