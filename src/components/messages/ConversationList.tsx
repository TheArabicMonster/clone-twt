"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { Plus } from "lucide-react";
import { NewMessageModal } from "./NewMessageModal";

interface ConversationPartner {
    id: string;
    pseudo: string;
    username: string;
    image: string | null;
}

interface Conversation {
    partner: ConversationPartner;
    lastMessage: {
        content: string;
        createdAt: string;
        senderId: string;
    };
    unreadCount: number;
}

interface ConversationListProps {
    currentUserId: string;
    activePartnerId?: string;
    onSelectConversation?: (partnerId: string) => void;
    className?: string;
}

export function ConversationList({
    currentUserId,
    activePartnerId,
    onSelectConversation,
    className = "",
}: ConversationListProps) {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/messages/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error("Erreur chargement conversations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        // Rafraîchir toutes les 10s pour capter les nouvelles conversations démarrées ailleurs
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    // Exposer la méthode de rafraîchissement pour que ChatWindow l'appelle après l'envoi
    useEffect(() => {
        const handler = () => fetchConversations();
        window.addEventListener("messages:refresh", handler);
        return () => window.removeEventListener("messages:refresh", handler);
    }, [fetchConversations]);

    const handleSelect = (partnerId: string) => {
        if (onSelectConversation) {
            onSelectConversation(partnerId);
        } else {
            router.push(`/messages/${partnerId}`);
        }
    };

    const truncate = (text: string, max = 40) =>
        text.length > max ? text.slice(0, max) + "…" : text;

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex items-center justify-between border-b border-default-200 p-4">
                <h2 className="text-xl font-bold">Messages</h2>
                <Button
                    isIconOnly
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={onOpen}
                    title="Nouveau message"
                    className="h-8 w-8 min-w-8 rounded-full"
                >
                    <Plus size={18} />
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-1 flex-col divide-y divide-default-100">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                            <div className="h-12 w-12 rounded-full bg-default-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 rounded bg-default-200" />
                                <div className="h-3 w-36 rounded bg-default-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : conversations.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-default-400">
                    <p className="text-sm">Aucune conversation pour le moment.</p>
                    <p className="text-xs">Envoie le premier message à quelqu&apos;un !</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-default-100">
                    {conversations.map(({ partner, lastMessage, unreadCount }) => {
                        const isActive = partner.id === activePartnerId;
                        const isOwnMessage = lastMessage.senderId === currentUserId;

                        return (
                            <button
                                key={partner.id}
                                onClick={() => handleSelect(partner.id)}
                                className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-default-50 ${isActive ? "bg-primary-50 dark:bg-primary-900/20" : ""
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <Avatar
                                        src={partner.image ?? undefined}
                                        name={partner.pseudo}
                                        size="md"
                                        className="flex-shrink-0"
                                    />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`truncate text-sm font-semibold ${unreadCount > 0 ? "text-foreground" : "text-default-700"}`}>
                                            {partner.pseudo}
                                        </span>
                                        <span className="flex-shrink-0 text-xs text-default-400">
                                            {new Date(lastMessage.createdAt).toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>
                                    <p className={`truncate text-xs ${unreadCount > 0 ? "font-medium text-foreground" : "text-default-400"}`}>
                                        {isOwnMessage ? "Vous : " : ""}
                                        {truncate(lastMessage.content)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
            <NewMessageModal isOpen={isOpen} onOpenChange={onOpenChange} />
        </div>
    );
}

