import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/conversations
// Retourne toutes les conversations de l'utilisateur connecté,
// avec leurs participants et le dernier message de chaque conversation.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: currentUserId,
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            pseudo: true,
            image: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Normalise la structure pour exposer le dernier message en champ plat
    const result = conversations.map((conversation) => ({
      id: conversation.id,
      participants: conversation.participants,
      lastMessage: conversation.messages[0] ?? null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/conversations]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/conversations
// Body: { participantId: string }
// Crée une nouvelle conversation ou retourne la conversation existante
// entre l'utilisateur connecté et le participantId fourni.
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const body = await request.json();
    const { participantId } = body as { participantId: string };

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId est requis" },
        { status: 400 }
      );
    }

    if (participantId === currentUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas créer une conversation avec vous-même" },
        { status: 400 }
      );
    }

    // Vérifie que l'autre utilisateur existe
    const otherUser = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true },
    });

    if (!otherUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Cherche une conversation existante avec exactement ces deux participants.
    // Sur MongoDB/Prisma on filtre les conversations qui contiennent les deux IDs,
    // puis on vérifie côté applicatif que la taille est exactement 2.
    const existingConversations = await prisma.conversation.findMany({
      where: {
        AND: [
          { participantIds: { has: currentUserId } },
          { participantIds: { has: participantId } },
        ],
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            pseudo: true,
            image: true,
          },
        },
      },
    });

    const existingConversation = existingConversations.find(
      (conv) => conv.participantIds.length === 2
    );

    if (existingConversation) {
      return NextResponse.json(existingConversation, { status: 200 });
    }

    // Crée la nouvelle conversation en connectant les deux participants
    const newConversation = await prisma.conversation.create({
      data: {
        participantIds: [currentUserId, participantId],
        participants: {
          connect: [{ id: currentUserId }, { id: participantId }],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            pseudo: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error("[POST /api/conversations]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
