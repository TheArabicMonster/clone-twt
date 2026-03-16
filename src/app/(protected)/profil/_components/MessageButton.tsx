"use client";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

export default function MessageButton({ userId }: { userId: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleClick() {
        setIsLoading(true);
        try {
            await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantId: userId }),
            });
            router.push("/messages");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button
            color="default"
            variant="bordered"
            isLoading={isLoading}
            onPress={handleClick}
            startContent={!isLoading && <MessageCircle size={16} />}
        >
            Envoyer un message
        </Button>
    );
}
