import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ConversationListWrapper } from "@/components/messages/ConversationListWrapper";

interface PageProps {
    params: Promise<{ userId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
    const { userId } = await params;
    const session = await requireAuth();
    const currentUserId = session.user.id;

    // Récupérer les informations du partenaire côté serveur
    const partner = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, pseudo: true, username: true, image: true },
    });

    if (!partner) {
        notFound();
    }

    return (
        <ConversationListWrapper
            currentUserId={currentUserId}
            partner={partner}
        />
    );
}
