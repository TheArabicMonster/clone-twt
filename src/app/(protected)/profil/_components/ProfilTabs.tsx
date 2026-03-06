"use client";
import { Button, ButtonGroup } from "@heroui/react";

export default function ProfilTabs() {
    return (
        <div className="flex flex-row w-full h-12 bg-gray-900 rounded-lg mb-4">
            <ButtonGroup variant="light" className="w-full h-full"> 
                <Button variant="light" className="flex-1">posts</Button>
                <Button variant="light" className="flex-1">réponses</Button>
                <Button variant="light" className="flex-1">likes</Button>
            </ButtonGroup>
        </div>
    );
}
