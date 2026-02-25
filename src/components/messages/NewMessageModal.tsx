"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Search } from "lucide-react";

interface UserResult {
    id: string;
    pseudo: string;
    username: string;
    image: string | null;
}

interface NewMessageModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewMessageModal({ isOpen, onOpenChange }: NewMessageModalProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setResults([]);
            return;
        }

        const searchUsers = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Erreur recherche:", error);
            } finally {
                setLoading(false);
            }
        };

        // Délai d'attente pour la recherche (debounce)
        const timer = setTimeout(searchUsers, 300);
        return () => clearTimeout(timer);
    }, [query, isOpen]);

    const handleSelectUser = (userId: string) => {
        onOpenChange(false);
        router.push(`/messages/${userId}`);
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Nouvelle discussion
                        </ModalHeader>
                        <ModalBody className="pb-6">
                            <Input
                                autoFocus
                                startContent={<Search className="text-default-400" size={18} />}
                                placeholder="Chercher des gens..."
                                value={query}
                                onValueChange={setQuery}
                                variant="bordered"
                            />

                            <div className="mt-4 flex min-h-[200px] flex-col gap-2">
                                {loading ? (
                                    <div className="flex h-full flex-1 items-center justify-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                ) : query.length >= 2 && results.length === 0 ? (
                                    <div className="flex h-full flex-1 items-center justify-center text-sm text-default-400">
                                        Aucun résultat pour &quot;{query}&quot;
                                    </div>
                                ) : query.length < 2 ? (
                                    <div className="flex h-full flex-1 items-center justify-center text-sm text-default-400">
                                        Tapez au moins 2 caractères
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {results.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleSelectUser(user.id)}
                                                className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-default-100"
                                            >
                                                <Avatar
                                                    src={user.image ?? undefined}
                                                    name={user.pseudo}
                                                    size="sm"
                                                />
                                                <div className="flex flex-col items-start">
                                                    <span className="text-sm font-semibold leading-none">
                                                        {user.pseudo}
                                                    </span>
                                                    <span className="text-xs text-default-500">
                                                        @{user.username}
                                                    </span>
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
    );
}
