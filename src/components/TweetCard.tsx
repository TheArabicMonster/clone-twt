"use client";

import { useState } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Heart, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface User {
    pseudo: string | null;
    username: string;
    image: string | null;
}

interface Like {
    id: string;
    userId: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: User;
}

export interface TweetData {
    id: string;
    content: string;
    createdAt: string;
    user: User;
    likes: Like[];
    comments: Comment[];
}

interface TweetCardProps {
    tweet: TweetData;
    currentUserId?: string;
}

export function TweetCard({ tweet, currentUserId }: TweetCardProps) {
    const [likesCount, setLikesCount] = useState(tweet.likes.length);
    const [isLiked, setIsLiked] = useState(
        currentUserId ? tweet.likes.some((l) => l.userId === currentUserId) : false
    );
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    const [comments, setComments] = useState(tweet.comments);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isReplyLoading, setIsReplyLoading] = useState(false);

    const handleLike = async () => {
        if (!currentUserId || isLikeLoading) return;

        setIsLikeLoading(true);
        // Mise à jour optimiste de l'interface
        setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
        setIsLiked(!isLiked);

        try {
            const res = await fetch(`/api/tweets/${tweet.id}/like`, {
                method: "POST",
            });

            if (!res.ok) {
                // Annuler en cas d'erreur
                setLikesCount((prev) => (!isLiked ? prev - 1 : prev + 1));
                setIsLiked(!isLiked);
            }
        } catch {
            // Annuler en cas d'erreur
            setLikesCount((prev) => (!isLiked ? prev - 1 : prev + 1));
            setIsLiked(!isLiked);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim() || isReplyLoading) return;

        setIsReplyLoading(true);
        try {
            const res = await fetch(`/api/tweets/${tweet.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyContent }),
            });

            if (res.ok) {
                const newComment = await res.json();
                setComments([...comments, newComment]);
                setReplyContent("");
                setShowReplyForm(false);
            }
        } catch (error) {
            console.error("Erreur lors de la réponse", error);
        } finally {
            setIsReplyLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 border border-default-200 rounded-2xl p-4 mb-4">
            {/* Corps du tweet */}
            <div className="flex gap-4">
                <Link href={`/profile/${tweet.user.username}`}>
                    <Avatar
                        src={tweet.user.image || undefined}
                        name={tweet.user.pseudo || "U"}
                        size="md"
                        className="transition-transform hover:scale-105"
                    />
                </Link>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{tweet.user.pseudo}</span>
                        <span className="text-sm text-default-500">@{tweet.user.username}</span>
                        <span className="text-sm text-default-500">·</span>
                        <span className="text-sm text-default-500 hover:underline">
                            {formatDistanceToNow(new Date(tweet.createdAt), {
                                addSuffix: true,
                                locale: fr,
                            })}
                        </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[15px]">{tweet.content}</p>

                    {/* Boutons d'action */}
                    <div className="mt-3 flex items-center justify-between text-default-500">
                        {/* Bouton répondre */}
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="flex items-center gap-2 transition-colors hover:text-primary group"
                            disabled={!currentUserId}
                        >
                            <div className="rounded-full p-2 transition-colors group-hover:bg-primary/10">
                                <MessageCircle size={18} />
                            </div>
                            <span className="text-sm">{comments.length > 0 ? comments.length : ""}</span>
                        </button>

                        {/* Bouton j'aime */}
                        <button
                            onClick={handleLike}
                            disabled={isLikeLoading || !currentUserId}
                            className={`flex items-center gap-2 transition-colors group ${isLiked ? "text-danger" : "hover:text-danger"
                                }`}
                        >
                            <div
                                className={`rounded-full p-2 transition-colors group-hover:bg-danger/10`}
                            >
                                <Heart
                                    size={18}
                                    fill={isLiked ? "currentColor" : "none"}
                                />
                            </div>
                            <span className="text-sm">{likesCount > 0 ? likesCount : ""}</span>
                        </button>

                        <div /> {/* Espace réservé pour l'alignement */}
                    </div>
                </div>
            </div>

            {/* Formulaire de réponse */}
            {showReplyForm && currentUserId && (
                <div className="ml-14 flex items-start gap-3 mt-2">
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Postez votre réponse"
                        className="w-full resize-none rounded-lg border border-default-200 bg-transparent p-3 text-sm focus:border-primary focus:outline-none"
                        rows={2}
                    />
                    <Button
                        color="primary"
                        size="sm"
                        onPress={handleReply}
                        isLoading={isReplyLoading}
                        isDisabled={!replyContent.trim()}
                    >
                        Répondre
                    </Button>
                </div>
            )}

            {/* Liste des commentaires */}
            {comments.length > 0 && (
                <div className="ml-14 mt-4 space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <Link href={`/profile/${comment.user.username}`}>
                                <Avatar
                                    src={comment.user.image || undefined}
                                    name={comment.user.pseudo || "U"}
                                    size="sm"
                                    className="transition-transform hover:scale-105"
                                />
                            </Link>
                            <div className="flex-1 bg-black border border-white rounded-lg px-4 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{comment.user.pseudo}</span>
                                    <span className="text-xs text-default-500">
                                        @{comment.user.username}
                                    </span>
                                    <span className="text-xs text-default-500">·</span>
                                    <span className="text-xs text-default-500">
                                        {formatDistanceToNow(new Date(comment.createdAt), {
                                            addSuffix: true,
                                            locale: fr,
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
