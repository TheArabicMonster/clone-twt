"use client";

import { useState, KeyboardEvent, useRef } from "react";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { SendHorizonal } from "lucide-react";

interface MessageInputProps {
    onSend: (content: string) => Promise<void>;
    sending?: boolean;
}

const MAX_CHARS = 500;

export function MessageInput({ onSend, sending = false }: MessageInputProps) {
    const [value, setValue] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (trimmed.length > MAX_CHARS) {
            setError(`Maximum ${MAX_CHARS} caractères`);
            return;
        }
        setError(null);
        await onSend(trimmed);
        setValue("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const remaining = MAX_CHARS - value.length;
    const isOverLimit = remaining < 0;

    return (
        <div className="border-t border-default-200 px-4 py-3">
            <div className="flex items-end gap-2">
                <Textarea
                    placeholder="Écrivez votre message…"
                    value={value}
                    onValueChange={setValue}
                    onKeyDown={handleKeyDown as never}
                    minRows={1}
                    maxRows={5}
                    isInvalid={isOverLimit || !!error}
                    errorMessage={error ?? (isOverLimit ? `Dépasse la limite de ${MAX_CHARS} caractères` : undefined)}
                    classNames={{
                        base: "flex-1",
                        input: "resize-none",
                    }}
                    description={
                        value.length > MAX_CHARS * 0.8 ? (
                            <span className={isOverLimit ? "text-danger" : "text-default-400"}>
                                {remaining} caractères restants
                            </span>
                        ) : null
                    }
                />
                <Button
                    isIconOnly
                    color="primary"
                    onPress={handleSend}
                    isDisabled={!value.trim() || isOverLimit || sending}
                    isLoading={sending}
                    className="mb-1 h-10 w-10 flex-shrink-0"
                    title="Envoyer"
                >
                    {!sending && <SendHorizonal size={18} />}
                </Button>
            </div>
        </div>
    );
}
