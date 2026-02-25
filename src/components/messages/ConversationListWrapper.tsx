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

// Responsive master-detail layout:
// - Mobile: show only list OR chat (toggle on selection / back)
// - Desktop: show both side by side
export function ConversationListWrapper({
    currentUserId,
    partner,
}: ConversationListWrapperProps) {
    const router = useRouter();
    // On mobile, if we have a partner selected we show chat view
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
            {/* Sidebar: hidden on mobile when chat is open */}
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

            {/* Chat: hidden on mobile when list is open */}
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
