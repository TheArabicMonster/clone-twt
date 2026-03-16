import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// GET /api/conversations/[conversationId]/messages
// Retourne les messages de la conversation, ordonnés du plus ancien au plus récent.
// Vérifie que l'utilisateur connecté est bien participant de la conversation.
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { conversationId } = await params;
    const currentUserId = session.user.id;

    // Vérifie que la conversation existe et que l'utilisateur est participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantIds: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
    }

    if (!conversation.participantIds.includes(currentUserId)) {
      return NextResponse.json(
        { error: "Accès refusé à cette conversation" },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            pseudo: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[GET /api/conversations/[conversationId]/messages]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[conversationId]/messages
// Body: { content: string }
// Crée un message, déclenche l'event Pusher new-message, retourne le message créé.
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { conversationId } = await params;
    const currentUserId = session.user.id;
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du message est requis" },
        { status: 400 }
      );
    }

    // Vérifie que la conversation existe et que l'utilisateur est participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantIds: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
    }

    if (!conversation.participantIds.includes(currentUserId)) {
      return NextResponse.json(
        { error: "Accès refusé à cette conversation" },
        { status: 403 }
      );
    }

    // Crée le message et met à jour updatedAt de la conversation atomiquement
    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: content.trim(),
          senderId: currentUserId,
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              pseudo: true,
              image: true,
            },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Déclenche l'event temps réel sur le channel Pusher de la conversation
    await pusherServer.trigger(
      `conversation-${conversationId}`,
      "new-message",
      newMessage
    );

    // Déclenche l'event sur le canal personnel du destinataire
    // pour notifier une nouvelle conversation sans que la page messages soit ouverte
    const recipientId = conversation.participantIds.find(
      (id) => id !== currentUserId
    );
    if (recipientId) {
      await pusherServer.trigger(
        `user-${recipientId}`,
        "new-message",
        newMessage
      );
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("[POST /api/conversations/[conversationId]/messages]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
