import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
    content: z
        .string()
        .min(1, "Le commentaire ne peut pas être vide")
        .max(280, "Le commentaire ne peut pas dépasser 280 caractères"),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = commentSchema.parse(body);
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

        const comment = await prisma.comment.create({
            data: {
                content: validatedData.content,
                userId: session.user.id,
                tweetId: tweetId,
            },
            include: {
                user: {
                    select: { pseudo: true, username: true, image: true },
                },
            },
        });

        const serialized = {
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
        };

        return NextResponse.json(serialized, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }
        console.error("Erreur création commentaire:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue" },
            { status: 500 }
        );
    }
}
