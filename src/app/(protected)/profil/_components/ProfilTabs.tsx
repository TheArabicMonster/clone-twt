"use client";
import TweetCard from "@/components/TweetCard";
import { Prisma } from "@prisma/client";
import { Button, ButtonGroup, Avatar, Card, CardBody } from "@heroui/react";
import { useEffect, useState } from "react";

type TweetWithUser = Prisma.TweetGetPayload<{
    include: { user: true; likes: true; _count: { select: { likes: true; comments: true } } };
}>;

type CommentWithTweet = Prisma.CommentGetPayload<{
    include: { user: true; tweet: { include: { user: true } } };
}>;

export default function ProfilTabs({ userId }: { userId: string }) {
    const [activeTab, setActiveTab] = useState("posts");
    const [tweets, setTweets] = useState<TweetWithUser[]>([]);
    const [comments, setComments] = useState<CommentWithTweet[]>([]);
    const [likedTweets, setLikedTweets] = useState<TweetWithUser[]>([]);

    useEffect(() => {
        if (activeTab === "posts") {
            fetch(`/api/tweets/user/${userId}`)
                .then(res => res.json())
                .then(data => setTweets(data));
        }
        if (activeTab === "réponses") {
            fetch(`/api/comments/user/${userId}`)
                .then(res => res.json())
                .then(data => setComments(data));
        }
        if (activeTab === "likes") {
            fetch(`/api/tweets/liked/${userId}`)
                .then(res => res.json())
                .then(data => setLikedTweets(data));
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

            {activeTab === "réponses" && (
                <div className="w-full">
                    {comments.length === 0 ? (
                        <div className="text-gray-400 text-center mt-4">Aucune réponse pour le moment</div>
                    ) : (
                        comments.map(comment => (
                            <Card key={comment.id} className="w-full rounded-none border-b border-gray-700 bg-transparent shadow-none">
                                <CardBody className="flex flex-col gap-2 p-4">
                                    {/* Tweet parent — bloc contexte */}
                                    <div className="border border-gray-700 rounded-lg p-3 bg-white/5 flex flex-row gap-3">
                                        <Avatar src={comment.tweet.user.image ?? undefined} size="sm" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <span className="text-white font-semibold text-sm">{comment.tweet.user.pseudo}</span>
                                                <span className="text-gray-400 text-sm">@{comment.tweet.user.username}</span>
                                                <span className="text-gray-500 text-sm">· {new Date(comment.tweet.createdAt).toLocaleDateString("fr-FR")}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm mt-1 break-words line-clamp-2">{comment.tweet.content}</p>
                                        </div>
                                    </div>

                                    {/* Réponse de l'utilisateur */}
                                    <div className="flex flex-row gap-3">
                                        <Avatar src={comment.user.image ?? undefined} size="md" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <span className="text-white font-semibold">{comment.user.pseudo}</span>
                                                <span className="text-gray-400 text-sm">@{comment.user.username}</span>
                                                <span className="text-gray-500 text-sm">· {new Date(comment.createdAt).toLocaleDateString("fr-FR")}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1">
                                                En réponse à <span className="text-blue-400">@{comment.tweet.user.username}</span>
                                            </p>
                                            <p className="text-white mt-1 break-words">{comment.content}</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeTab === "likes" && (
                <div className="w-full">
                    {likedTweets.length === 0 ? (
                        <div className="text-gray-400 text-center mt-4">Aucun like pour le moment</div>
                    ) : (
                        likedTweets.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
                    )}
                </div>
            )}
        </div>
    );
}
