"use client";
import { Button } from "@heroui/react";
import { MessageCircle } from "lucide-react";

export default function ButtonComment({ tweetId, initialComments }: { tweetId: string, initialComments: number }) {
    return (
        <Button variant="light" size="sm" startContent={<MessageCircle size={16} />}>
            {initialComments}
        </Button>
    );
}
