import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tweetSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(280, "Le tweet ne peut pas dépasser 280 caractères"),
});

// Créer un tweet
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = tweetSchema.parse(body);

    const tweet = await prisma.tweet.create({
      data: {
        content: validatedData.content,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { pseudo: true, username: true, image: true },
        },
        likes: { select: { id: true, userId: true } },
        comments: { select: { id: true } },
      },
    });

    return NextResponse.json(tweet, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }
    console.error("Erreur création tweet:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}

// Récupérer les tweets (timeline)
export async function GET() {
  try {
    const tweets = await prisma.tweet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { pseudo: true, username: true, image: true },
        },
        likes: { select: { id: true, userId: true } },
        comments: { select: { id: true } },
      },
    });

    const serialized = tweets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Erreur récupération tweets:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}
