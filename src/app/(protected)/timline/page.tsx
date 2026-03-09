"use client";
import SearchBar from "@/app/(protected)/timline/_compnents/SearchBar";
import TweetButton from "@/app/(protected)/timline/_compnents/TweetButton";
import TweetPopup from "@/app/(protected)/timline/_compnents/TweetPopup";
import TweetCard from "@/components/TweetCard";
import { useDisclosure } from "@heroui/react";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export default function Timeline() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const router = useRouter();
    type TweetWithUser = Prisma.TweetGetPayload<{ 
        include: { user: true, _count: { select: { likes: true, comments: true } } } 
    }>;

    const [tweets, setTweets] = useState<TweetWithUser[]>([]);
    useEffect(() => {
        fetch("/api/tweets")
            .then(res => res.json())
            .then(data => setTweets(data))
    }, []);
    return (
        <div className="flex flex-col w-full">
            <SearchBar/>
            <div className="relative bg-gray-900 w-full h-[calc(100vh-6rem)] rounded-lg p-4 mt-2 mb-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {tweets.length === 0 ? 
                    <div className="text-white text-lg">Aucun tweet à afficher pour le moment</div>
                    : tweets.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
                }
                <TweetPopup isOpen={isOpen} onClose={onClose} onSuccess={() => { onClose(); router.refresh(); }} />
                
            </div>
            <div className="absolute bottom-6 right-6">
                    <TweetButton onClick={onOpen} />
                </div>
        </div>
    )
}