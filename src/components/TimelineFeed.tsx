"use client";

import { useEffect, useState, useCallback } from "react";
import { TweetCard, TweetData } from "@/components/TweetCard";
import { ComposeTweet } from "@/components/ComposeTweet";
import { Spinner } from "@heroui/react";

interface TimelineFeedProps {
    currentUserId?: string;
}

export function TimelineFeed({ currentUserId }: TimelineFeedProps) {
    const [tweets, setTweets] = useState<TweetData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchTweets = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/tweets");
            if (!res.ok) {
                throw new Error("Erreur lors de la récupération des tweets");
            }
            const data = await res.json();
            setTweets(data);
        } catch (err) {
            setError("Impossible de charger le fil d'actualité.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTweets();
    }, [fetchTweets]);

    return (
        <div className="relative pb-24">
            {/* Section de composition de tweet pour la timeline */}
            <ComposeTweet onTweetCreated={fetchTweets} />

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Spinner />
                </div>
            ) : error ? (
                <div className="p-4 text-center text-danger">{error}</div>
            ) : tweets.length === 0 ? (
                <div className="p-8 text-center text-default-500">
                    Aucun tweet pour le moment.
                </div>
            ) : (
                <div className="flex flex-col border-x border-default-200">
                    {tweets.map((tweet) => (
                        <TweetCard
                            key={tweet.id}
                            tweet={tweet}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
