import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";
import { z } from "zod";

const messageSchema = z.object({
    content: z
        .string()
        .min(1, "Le message ne peut pas être vide")
        .max(500, "Le message ne peut pas dépasser 500 caractères"),
    receiverId: z.string().min(1, "Destinataire requis"),
});

// GET /api/messages?with=[userId] — récupérer l'historique de la conversation
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const withUserId = searchParams.get("with");

        if (!withUserId) {
            return NextResponse.json(
                { error: "Paramètre 'with' requis" },
                { status: 400 },
            );
        }

        const currentUserId = session.user.id;

        // Récupérer tous les messages entre les deux utilisateurs, triés par ordre croissant
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: withUserId },
                    { senderId: withUserId, receiverId: currentUserId },
                ],
            },
            orderBy: { createdAt: "asc" },
            include: {
                sender: {
                    select: { id: true, pseudo: true, username: true, image: true },
                },
                receiver: {
                    select: { id: true, pseudo: true, username: true, image: true },
                },
            },
        });

        // Marquer les messages de l'autre utilisateur comme lus
        await prisma.message.updateMany({
            where: {
                senderId: withUserId,
                receiverId: currentUserId,
                isRead: false,
            },
            data: { isRead: true },
        });

        const serialized = messages.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
        }));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error("Erreur récupération messages:", error);
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}

// POST /api/messages — envoyer un nouveau message
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = messageSchema.parse(body);

        const currentUserId = session.user.id;

        // Vérifier si le destinataire existe
        const receiver = await prisma.user.findUnique({
            where: { id: validatedData.receiverId },
            select: { id: true, pseudo: true, username: true, image: true },
        });

        if (!receiver) {
            return NextResponse.json(
                { error: "Destinataire introuvable" },
                { status: 404 },
            );
        }

        // Créer le message en BD
        const message = await prisma.message.create({
            data: {
                content: validatedData.content,
                senderId: currentUserId,
                receiverId: validatedData.receiverId,
            },
            include: {
                sender: {
                    select: { id: true, pseudo: true, username: true, image: true },
                },
                receiver: {
                    select: { id: true, pseudo: true, username: true, image: true },
                },
            },
        });

        const serialized = {
            ...message,
            createdAt: message.createdAt.toISOString(),
        };

        // Pusher : diffuser sur un canal canonique (ID triés pour l'unicité)
        const channelId = [currentUserId, validatedData.receiverId].sort().join("-");
        await pusher.trigger(`chat-${channelId}`, "new-message", serialized);

        return NextResponse.json(serialized, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 },
            );
        }
        console.error("Erreur envoi message:", error);
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}
