"use client";
import TweetCard from "@/components/TweetCard";
import { Prisma } from "@prisma/client";
import { Button, ButtonGroup } from "@heroui/react";
import { useEffect, useState } from "react";

type TweetWithUser = Prisma.TweetGetPayload<{
    include: { user: true; likes: true; _count: { select: { likes: true; comments: true } } };
}>;

export default function ProfilTabs({ userId }: { userId: string }) {
    const [activeTab, setActiveTab] = useState("posts");
    const [tweets, setTweets] = useState<TweetWithUser[]>([]);

    useEffect(() => {
        if (activeTab === "posts") {
            fetch(`/api/tweets/user/${userId}`)
                .then(res => res.json())
                .then(data => setTweets(data));
        }
    }, [activeTab, userId]);

    return (
        <div className="flex flex-col w-full">
            <div className="sticky top-0 z-10 flex flex-row w-full h-12 bg-gray-900 rounded-lg mb-4">
                <ButtonGroup variant="light" className="w-full h-full">
                    <Button
                        variant="light"
                        className={`flex-1 ${activeTab === "posts" ? "border-b-2 border-white" : ""}`}
                        onPress={() => setActiveTab("posts")}
                    >
                        posts
                    </Button>
                    <Button
                        variant="light"
                        className={`flex-1 ${activeTab === "réponses" ? "border-b-2 border-white" : ""}`}
                        onPress={() => setActiveTab("réponses")}
                    >
                        réponses
                    </Button>
                    <Button
                        variant="light"
                        className={`flex-1 ${activeTab === "likes" ? "border-b-2 border-white" : ""}`}
                        onPress={() => setActiveTab("likes")}
                    >
                        likes
                    </Button>
                </ButtonGroup>
            </div>

            {activeTab === "posts" && (
                <div className="w-full">
                    {tweets.length === 0 ? (
                        <div className="text-gray-400 text-center mt-4">Aucun tweet pour le moment</div>
                    ) : (
                        tweets.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
                    )}
                </div>
            )}
        </div>
    );
}