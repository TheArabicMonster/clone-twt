import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages/conversations
// Retourne une liste de partenaires de conversation distincts,
// chacun avec le dernier message et le nombre non lus, triés par récence.
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const currentUserId = session.user.id;

        // Récupérer tous les messages impliquant l'utilisateur courant
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId },
                ],
            },
            orderBy: { createdAt: "desc" },
            include: {
                sender: {
                    select: { id: true, pseudo: true, username: true, image: true },
                },
                receiver: {
                    select: { id: true, pseudo: true, username: true, image: true },
                },
            },
        });

        // Construire une map : ID partenaire → { lastMessage, unreadCount }
        const conversationMap = new Map<
            string,
            {
                partner: { id: string; pseudo: string; username: string; image: string | null };
                lastMessage: { content: string; createdAt: string; senderId: string };
                unreadCount: number;
            }
        >();

        for (const message of messages) {
            const isCurrentSender = message.senderId === currentUserId;
            const partner = isCurrentSender ? message.receiver : message.sender;

            if (!conversationMap.has(partner.id)) {
                conversationMap.set(partner.id, {
                    partner,
                    lastMessage: {
                        content: message.content,
                        createdAt: message.createdAt.toISOString(),
                        senderId: message.senderId,
                    },
                    unreadCount: 0,
                });
            }

            // Compter les messages non lus de ce partenaire
            if (!isCurrentSender && !message.isRead) {
                const entry = conversationMap.get(partner.id)!;
                entry.unreadCount += 1;
            }
        }

        const conversations = Array.from(conversationMap.values());

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("Erreur liste conversations:", error);
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }
}
