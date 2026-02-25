"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";

interface Partner {
    id: string;
    pseudo: string;
    username: string;
    image: string | null;
}

interface ConversationListWrapperProps {
    currentUserId: string;
    partner: Partner;
}

// Disposition réactive maître-détails :
// - Mobile : affiche uniquement la liste OU le chat (bascule sur sélection / retour)
// - Bureau : affiche les deux côte à côte
export function ConversationListWrapper({
    currentUserId,
    partner,
}: ConversationListWrapperProps) {
    const router = useRouter();
    // Sur mobile, si un partenaire est sélectionné, on affiche la vue chat
    const [mobileChatOpen, setMobileChatOpen] = useState(true);

    const handleSelectConversation = (partnerId: string) => {
        router.push(`/messages/${partnerId}`);
        setMobileChatOpen(true);
    };

    const handleBack = () => {
        setMobileChatOpen(false);
        router.push("/messages");
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Barre latérale : masquée sur mobile quand le chat est ouvert */}
            <div
                className={`flex-col border-r border-default-200 md:flex md:w-80 lg:w-96 ${mobileChatOpen ? "hidden" : "flex w-full"
                    }`}
            >
                <ConversationList
                    currentUserId={currentUserId}
                    activePartnerId={partner.id}
                    onSelectConversation={handleSelectConversation}
                    className="flex-1"
                />
            </div>

            {/* Chat : masqué sur mobile quand la liste est ouverte */}
            <div
                className={`flex-col md:flex md:flex-1 ${mobileChatOpen ? "flex flex-1" : "hidden"
                    }`}
            >
                <ChatWindow
                    currentUserId={currentUserId}
                    partner={partner}
                    onBack={handleBack}
                />
            </div>
        </div>
    );
}
