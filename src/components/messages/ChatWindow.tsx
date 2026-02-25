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

    // Scroll to bottom on new messages
    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Load conversation history
    const loadMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/messages?with=${partner.id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                // Notify conversation list to refresh unread counts
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

    // Pusher real-time subscription
    useEffect(() => {
        const channelId = [currentUserId, partner.id].sort().join("-");
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`chat-${channelId}`);

        channel.bind("new-message", (data: Message) => {
            setMessages((prev) => {
                // Avoid absolute duplicates
                if (prev.some((m) => m.id === data.id)) return prev;

                // If it's a message we sent, check if we have a matching optimistic message
                if (data.senderId === currentUserId) {
                    const optIndex = prev.findIndex(
                        m => m.id.startsWith("optimistic-") && m.content === data.content
                    );
                    if (optIndex !== -1) {
                        // Replace the optimistic message with the real one from Pusher
                        const next = [...prev];
                        next[optIndex] = data;
                        return next;
                    }
                }

                // Otherwise, just append it
                return [...prev, data];
            });
            // Refresh conversation list
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

        // Optimistic update
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
                        // Pusher event already replaced the optimistic message.
                        // Ensure the real message is in the list just in case.
                        if (!prev.some(m => m.id === real.id)) {
                            return [...prev, real];
                        }
                        return prev;
                    }
                    // Fetch completed first, replace optimistic with real message
                    return prev.map((m) => (m.id === optimistic.id ? real : m));
                });
                window.dispatchEvent(new Event("messages:refresh"));
            } else {
                // Remove optimistic on failure
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
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-default-200 px-4 py-3">
                {onBack && (
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={onBack}
                        className="md:hidden"
                    >
                        <ArrowLeft size={20} />
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

            {/* Messages area */}
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
                                            className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${isOwn
                                                ? "rounded-br-sm bg-primary text-white"
                                                : "rounded-bl-sm bg-default-100 text-foreground dark:bg-default-200"
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

            {/* Input */}
            <MessageInput onSend={sendMessage} sending={sending} />
        </div>
    );
}
