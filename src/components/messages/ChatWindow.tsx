"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";
import { getPusherClient } from "@/lib/pusher-client";
import { MessageInput } from "./MessageInput";

interface MessageUser {
    id: string;
    pseudo: string;
    username: string;
    image: string | null;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    receiverId: string;
    isRead: boolean;
    sender: MessageUser;
    receiver: MessageUser;
}

interface ChatWindowProps {
    currentUserId: string;
    partner: MessageUser;
    onBack?: () => void;
}

export function ChatWindow({ currentUserId, partner, onBack }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Faire défiler vers le bas pour les nouveaux messages
    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Charger l'historique de la conversation
    const loadMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/messages?with=${partner.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                // Notifier la liste de conversations pour rafraîchir le nombre de non lus
                window.dispatchEvent(new Event("messages:refresh"));
            }
        } catch (error) {
            console.error("Erreur chargement messages:", error);
        } finally {
            setLoading(false);
        }
    }, [partner.id]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Abonnement temps réel Pusher
    useEffect(() => {
        const channelId = [currentUserId, partner.id].sort().join("-");
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`chat-${channelId}`);

        channel.bind("new-message", (data: Message) => {
            setMessages((prev) => {
                // Éviter les doublons absolus
                if (prev.some((m) => m.id === data.id)) return prev;

                // Si c'est un message que nous avons envoyé, vérifier si nous avons un message optimiste correspondant
                if (data.senderId === currentUserId) {
                    const optIndex = prev.findIndex(
                        m => m.id.startsWith("optimistic-") && m.content === data.content
                    );
                    if (optIndex !== -1) {
                        // Remplacer le message optimiste par le vrai provenant de Pusher
                        const next = [...prev];
                        next[optIndex] = data;
                        return next;
                    }
                }

                // Sinon, l'ajouter simplement
                return [...prev, data];
            });
            // Rafraîchir la liste des conversations
            window.dispatchEvent(new Event("messages:refresh"));
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`chat-${channelId}`);
        };
    }, [currentUserId, partner.id]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || sending) return;

        setSending(true);

        // Mise à jour optimiste
        const optimistic: Message = {
            id: `optimistic-${Date.now()}`,
            content,
            createdAt: new Date().toISOString(),
            senderId: currentUserId,
            receiverId: partner.id,
            isRead: false,
            sender: { id: currentUserId, pseudo: "", username: "", image: null },
            receiver: partner,
        };
        setMessages((prev) => [...prev, optimistic]);

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, receiverId: partner.id }),
            });

            if (res.ok) {
                const real: Message = await res.json();
                setMessages((prev) => {
                    const hasOptimistic = prev.some(m => m.id === optimistic.id);
                    if (!hasOptimistic) {
                        // L'événement Pusher a déjà remplacé le message optimiste.
                        // S'assurer que le vrai message est dans la liste au cas où.
                        if (!prev.some(m => m.id === real.id)) {
                            return [...prev, real];
                        }
                        return prev;
                    }
                    // La requête s'est terminée en premier, remplacer le message optimiste par le vrai
                    return prev.map((m) => (m.id === optimistic.id ? real : m));
                });
                window.dispatchEvent(new Event("messages:refresh"));
            } else {
                // Supprimer le message optimiste en cas d'échec
                setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            }
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* En-tête */}
            <div className="flex items-center gap-3 border-b border-default-200 px-4 py-3">
                {onBack && (
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={onBack}
                        className="md:hidden"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </Button>
                )}
                <Link
                    href={`/profile/${partner.username}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                    <Avatar
                        src={partner.image ?? undefined}
                        name={partner.pseudo}
                        size="sm"
                    />
                    <div>
                        <p className="text-sm font-bold leading-tight">{partner.pseudo}</p>
                        <p className="text-xs text-default-400">@{partner.username}</p>
                    </div>
                </Link>
            </div>

            {/* Zone des messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-default-400">
                        <p className="text-sm">Aucun message. Dites bonjour ! 👋</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {messages.map((message) => {
                            const isOwn = message.senderId === currentUserId;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                >
                                    <div className="flex max-w-[75%] flex-col gap-1">
                                        <div
                                            className={`break-all whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${isOwn
                                                ? "rounded-br-sm bg-primary text-white"
                                                : "rounded-bl-sm border-2 border-primary bg-transparent text-foreground"
                                                }`}
                                        >
                                            {message.content}
                                        </div>
                                        <p
                                            className={`text-[10px] text-default-400 ${isOwn ? "text-right" : "text-left"
                                                }`}
                                        >
                                            {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Saisie */}
            <MessageInput onSend={sendMessage} sending={sending} />
        </div>
    );
}
