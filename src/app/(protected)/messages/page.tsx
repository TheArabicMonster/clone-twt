"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import {
  Button,
  Input,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
} from "@heroui/react";
import { Send, Plus, MessageCircle, Search } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParticipantUser {
  id: string;
  username: string;
  pseudo: string;
  image?: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: ParticipantUser;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: ParticipantUser[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOtherParticipant(
  conversation: Conversation,
  currentUserId: string
): ParticipantUser | null {
  return (
    conversation.participants.find((p) => p.id !== currentUserId) ?? null
  );
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Messages() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");

  // New conversation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ParticipantUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<ParticipantUser[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch conversations on mount ──────────────────────────────────────────

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data: Conversation[] = await res.json();
          setConversations(data);
        }
      } catch {
        // network error — fail silently
      }
    }
    loadConversations();
  }, []);

  // ── Fetch messages + subscribe Pusher when conversation changes ───────────

  useEffect(() => {
    if (!activeConversation) return;

    const conversationId = activeConversation.id;

    async function loadMessages() {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages`
        );
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(data);
        }
      } catch {
        // network error — fail silently
      }
    }

    loadMessages();

    // Pusher subscription
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", (incoming: Message) => {
      setMessages((prev) => {
        // Deduplicate — the sender may have already appended the message
        // optimistically from the POST response
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
      pusher.disconnect();
    };
  }, [activeConversation?.id]);

  // ── Auto-scroll to bottom on new messages ────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load suggestions when modal opens ────────────────────────────────────

  useEffect(() => {
    if (!isModalOpen) return;
    setIsSuggestionsLoading(true);
    fetch("/api/users/suggestions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ParticipantUser[]) => setSuggestions(data))
      .catch(() => {})
      .finally(() => setIsSuggestionsLoading(false));
  }, [isModalOpen]);

  // ── Debounced user search ─────────────────────────────────────────────────

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data: ParticipantUser[] = await res.json();
          setSearchResults(data);
        }
      } catch {
        // network error — fail silently
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeConversation) return;

    const content = messageInput.trim();
    setMessageInput("");

    try {
      const res = await fetch(
        `/api/conversations/${activeConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (res.ok) {
        const newMessage: Message = await res.json();
        // Append optimistically; Pusher handler will deduplicate
        setMessages((prev) =>
          prev.some((m) => m.id === newMessage.id)
            ? prev
            : [...prev, newMessage]
        );
        // Refresh last message preview in the sidebar list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  lastMessage: {
                    content,
                    createdAt: newMessage.createdAt,
                  },
                }
              : c
          )
        );
      } else {
        // Restore input on failure
        setMessageInput(content);
      }
    } catch {
      setMessageInput(content);
    }
  }, [messageInput, activeConversation]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const startConversation = useCallback(
    async (user: ParticipantUser) => {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: user.id }),
        });

        if (res.ok) {
          const convo: Conversation = await res.json();
          setConversations((prev) =>
            prev.some((c) => c.id === convo.id) ? prev : [convo, ...prev]
          );
          setActiveConversation(convo);
          setIsModalOpen(false);
          setSearchQuery("");
          setSearchResults([]);
        }
      } catch {
        // network error — fail silently
      }
    },
    []
  );

  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const otherParticipant = activeConversation
    ? getOtherParticipant(activeConversation, currentUserId)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-900">
        <h1 className="text-white font-bold text-lg">Messages</h1>
        <Button
          size="sm"
          color="primary"
          startContent={<Plus size={15} strokeWidth={2} />}
          onPress={() => setIsModalOpen(true)}
        >
          Nouvelle discussion
        </Button>
      </header>

      {/* ── Main panel ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Conversation list ── */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-700 overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10 px-4">
              Aucune conversation pour le moment.
            </p>
          ) : (
            conversations.map((convo) => {
              const other = getOtherParticipant(convo, currentUserId);
              const isActive = activeConversation?.id === convo.id;

              return (
                <button
                  key={convo.id}
                  onClick={() => setActiveConversation(convo)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-800 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    isActive ? "bg-gray-800" : ""
                  }`}
                >
                  <Avatar
                    src={other?.image ?? undefined}
                    name={other?.pseudo ?? "?"}
                    size="md"
                    className="flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-semibold text-sm truncate">
                      {other?.pseudo ?? "Utilisateur"}
                    </span>
                    <span className="text-gray-400 text-xs truncate">
                      {convo.lastMessage?.content ?? "Aucun message"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* ── Message area ── */}
        <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          {!activeConversation ? (
            /* Empty state */
            <div
              className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-600"
              aria-label="Aucune conversation sélectionnée"
            >
              <MessageCircle size={52} strokeWidth={1} />
              <p className="text-base font-medium">
                Sélectionne une conversation
              </p>
            </div>
          ) : (
            <>
              {/* ── Conversation header ── */}
              <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-900">
                <Avatar
                  src={otherParticipant?.image ?? undefined}
                  name={otherParticipant?.pseudo ?? "?"}
                  size="sm"
                />
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">
                    {otherParticipant?.pseudo ?? "Utilisateur"}
                  </p>
                  <p className="text-gray-400 text-xs">
                    @{otherParticipant?.username}
                  </p>
                </div>
              </div>

              {/* ── Messages list ── */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700"
                aria-label="Messages"
                aria-live="polite"
              >
                {messages.length === 0 && (
                  <p className="text-gray-600 text-sm text-center mt-8">
                    Aucun message. Commencez la conversation !
                  </p>
                )}

                {messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[68%] min-w-0 ${
                        isOwn
                          ? "self-end items-end"
                          : "self-start items-start"
                      }`}
                    >
                      <div
                        className={`w-full px-4 py-2 rounded-2xl text-white text-sm break-words [overflow-wrap:anywhere] ${
                          isOwn
                            ? "bg-primary/80 rounded-br-sm"
                            : "bg-gray-700 rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-gray-500 text-xs mt-1 px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })}

                {/* Anchor for auto-scroll */}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Message input ── */}
              <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-gray-700 bg-gray-900">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Écris un message..."
                  variant="bordered"
                  aria-label="Saisir un message"
                  classNames={{
                    input: "text-white placeholder:text-gray-500",
                    inputWrapper:
                      "border-gray-600 bg-gray-800 hover:border-gray-500 data-[focus=true]:border-primary",
                  }}
                  className="flex-1"
                />
                <Button
                  isIconOnly
                  color="primary"
                  onPress={sendMessage}
                  isDisabled={!messageInput.trim()}
                  aria-label="Envoyer le message"
                >
                  <Send size={17} strokeWidth={2} />
                </Button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── New conversation modal ── */}
      <Modal
        isOpen={isModalOpen}
        onOpenChange={handleModalOpenChange}
        placement="center"
        size="sm"
        classNames={{
          base: "bg-gray-800 border border-gray-700",
          header: "border-b border-gray-700 text-white",
          body: "pb-6",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader>Nouvelle discussion</ModalHeader>
              <ModalBody>
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={
                    <Search size={15} className="text-gray-400 flex-shrink-0" />
                  }
                  variant="bordered"
                  aria-label="Rechercher un utilisateur"
                  classNames={{
                    input: "text-white placeholder:text-gray-500",
                    inputWrapper:
                      "border-gray-600 bg-gray-700 hover:border-gray-500 data-[focus=true]:border-primary",
                  }}
                  autoFocus
                />

                {/*
                  Fixed-height results area — prevents any layout shift when
                  transitioning between the four possible states:
                  initial / searching / no-results / results-list.
                  Every state fills the box via absolute inset-0 so the modal
                  height stays constant throughout the interaction.
                */}
                <div className="relative mt-3 h-[200px]">

                  {/* 1 — Initial state: no query typed yet */}
                  {!searchQuery.trim() && !isSearching && (
                    isSuggestionsLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner size="sm" color="primary" />
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="absolute inset-0 flex flex-col overflow-y-auto py-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                        <p className="text-gray-500 text-xs px-3 pb-1">Suggestions</p>
                        {suggestions.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => startConversation(user)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700/70 active:scale-[0.99] active:opacity-70 transition-all text-left w-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                          >
                            <Avatar src={user.image ?? undefined} name={user.pseudo} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-sm font-semibold leading-tight truncate">{user.pseudo}</p>
                              <p className="text-gray-400 text-xs truncate">@{user.username}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600 select-none">
                        <Search size={22} strokeWidth={1.5} />
                        <p className="text-sm">Commencez à taper pour rechercher</p>
                      </div>
                    )
                  )}

                  {/* 2 — Searching: HeroUI Spinner instead of plain text */}
                  {isSearching && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner size="sm" color="primary" />
                    </div>
                  )}

                  {/* 3 — No results found */}
                  {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-500 select-none">
                      <p className="text-sm">Aucun utilisateur trouvé.</p>
                    </div>
                  )}

                  {/* 4 — Results list: bounded by the parent height, scrollable */}
                  {!isSearching && searchResults.length > 0 && (
                    <div className="absolute inset-0 flex flex-col gap-0.5 overflow-y-auto py-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => startConversation(user)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700/70 active:scale-[0.99] active:opacity-70 transition-all text-left w-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <Avatar
                            src={user.image ?? undefined}
                            name={user.pseudo}
                            size="sm"
                          />
                          {/* min-w-0 + truncate prevents long names from overflowing */}
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-semibold leading-tight truncate">
                              {user.pseudo}
                            </p>
                            <p className="text-gray-400 text-xs truncate">
                              @{user.username}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
