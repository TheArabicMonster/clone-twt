"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { useDisclosure } from "@heroui/modal";
import { EditProfileModal } from "@/components/EditProfileModal";

interface TweetData {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  likes: { id: string; userId: string }[];
  comments: { id: string }[];
  user?: { pseudo: string; username: string; image: string | null };
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  tweet: { id: string; content: string };
}

interface ProfileContentProps {
  user: {
    id: string;
    username: string;
    pseudo: string;
    bio: string | null;
    image: string | null;
    coverImage: string | null;
    createdAt: string;
    tweets: TweetData[];
    comments: CommentData[];
    likes: { id: string; tweet: TweetData }[];
    _count: {
      followers: number;
      following: number;
    };
  };
  isOwnProfile: boolean;
  currentUserId?: string;
  isFollowing: boolean;
}

export function ProfileContent({
  user: initialUser,
  isOwnProfile,
  isFollowing: initialIsFollowing,
}: ProfileContentProps) {
  const [user, setUser] = useState(initialUser);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(
    initialUser._count.followers,
  );
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleFollow = async () => {
    setIsFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${user.username}/follow`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.error("Erreur follow:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleProfileSaved = (data: {
    bio: string;
    image: string | null;
  }) => {
    setUser((prev) => ({
      ...prev,
      bio: data.bio,
      image: data.image,
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="w-full">
      {/* En-tête du profil */}
      <div className="border-b border-default-200 px-6 py-12">
        {/* Ligne 1 : Avatar + Pseudo/Username/Stats + Bouton */}
        <div className="flex items-center gap-4">
          <Avatar
            src={user.image ?? undefined}
            name={user.pseudo}
            className="h-24 w-24 shrink-0 text-xl"
          />

          <div className="flex flex-1 items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-tight">{user.pseudo}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="text-base text-default-500">@{user.username}</p>
                <div className="flex gap-3">
                  <span className="text-sm">
                    <span className="font-semibold">{followersCount}</span>{" "}
                    <span className="text-default-500">abonnés</span>
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">{user._count.following}</span>{" "}
                    <span className="text-default-500">abonnements</span>
                  </span>
                </div>
              </div>
            </div>

            {isOwnProfile ? (
              <Button variant="bordered" size="sm" onPress={onOpen}>
                Modifier
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  as={Link}
                  href={`/messages/${user.id}`}
                  variant="bordered"
                  size="sm"
                  title="Envoyer un message"
                >
                  Message
                </Button>
                <Button
                  color={isFollowing ? "default" : "primary"}
                  variant={isFollowing ? "bordered" : "solid"}
                  size="sm"
                  isLoading={isFollowLoading}
                  onPress={handleFollow}
                >
                  {isFollowing ? "Ne plus suivre" : "Suivre"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && <p className="mt-3 text-sm">{user.bio}</p>}

        <p className="mt-1 text-xs text-default-400">
          Rejoint le {formatDate(user.createdAt)}
        </p>
      </div>

      {/* Onglets */}
      <Tabs
        aria-label="Profil"
        variant="underlined"
        classNames={{
          base: "w-full px-0",
          tabList:
            " w-full border-default-200 gap-0 px-0 mx-0",
          tab: "flex-1 h-12",
          cursor: "bg-primary",
          panel: "px-0",
        }}
      >
        <Tab key="posts" title="Posts">
          <div className="space-y-4 px-4 py-4">
            {user.tweets.length === 0 ? (
              <p className="py-8 text-center text-default-400">
                Aucun post pour le moment
              </p>
            ) : (
              user.tweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="mb-4 rounded-2xl border border-default-200 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={user.image ?? undefined}
                      name={user.pseudo}
                      size="sm"
                    />
                    <div>
                      <span className="font-bold">{user.pseudo}</span>{" "}
                      <span className="text-default-500">@{user.username}</span>
                    </div>
                  </div>
                  <p className="mt-2 font-medium">{tweet.content}</p>
                  {tweet.image && (
                    <img
                      src={tweet.image}
                      alt=""
                      className="mt-2 rounded-lg"
                    />
                  )}
                  <div className="mt-2 flex gap-4 text-sm text-default-400">
                    <span>{tweet.likes.length} j&apos;aime</span>
                    <span>{tweet.comments.length} commentaires</span>
                    <span>{formatDate(tweet.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tab>

        <Tab key="replies" title="Réponses">
          <div className="space-y-4 px-4 py-4">
            {user.comments.length === 0 ? (
              <p className="py-8 text-center text-default-400">
                Aucune réponse pour le moment
              </p>
            ) : (
              user.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="mb-4 rounded-2xl border border-default-200 p-4"
                >
                  <p className="text-xs text-default-400">
                    En réponse à un tweet
                  </p>
                  <p className="mt-1 text-sm text-default-500 italic">
                    &quot;{comment.tweet.content}&quot;
                  </p>
                  <p className="mt-2 font-medium">{comment.content}</p>
                  <p className="mt-2 text-sm text-default-400">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Tab>

        <Tab key="likes" title="J'aime">
          <div className="space-y-4 px-4 py-4">
            {user.likes.length === 0 ? (
              <p className="py-8 text-center text-default-400">
                Aucun j&apos;aime pour le moment
              </p>
            ) : (
              user.likes.map((like) => (
                <div
                  key={like.id}
                  className="mb-4 rounded-2xl border border-default-200 p-4"
                >
                  {like.tweet.user && (
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={like.tweet.user.image ?? undefined}
                        name={like.tweet.user.pseudo}
                        size="sm"
                      />
                      <div>
                        <span className="font-bold">
                          {like.tweet.user.pseudo}
                        </span>{" "}
                        <span className="text-default-500">
                          @{like.tweet.user.username}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="mt-2 font-medium">{like.tweet.content}</p>
                  {like.tweet.image && (
                    <img
                      src={like.tweet.image}
                      alt=""
                      className="mt-2 rounded-lg"
                    />
                  )}
                  <div className="mt-2 flex gap-4 text-sm text-default-400">
                    <span>{like.tweet.likes.length} j&apos;aime</span>
                    <span>{like.tweet.comments.length} commentaires</span>
                    <span>{formatDate(like.tweet.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Modal de modification */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          username={user.username}
          currentBio={user.bio ?? ""}
          currentImage={user.image}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
