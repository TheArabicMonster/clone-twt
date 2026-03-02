"use client";
import { Button } from "@heroui/react";

export default function ProfilTabs() {
    return (
        <div className="w-full h-12 bg-gray-700 rounded-lg mb-4">
            <Button variant="light">posts</Button>
            <Button variant="light">réponses</Button>
            <Button variant="light">likes</Button>
        </div>
    );
}
