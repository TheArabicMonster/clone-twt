"use client";

import { useState } from "react";
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
    coverImage: string | null;
  }) => {
    setUser((prev) => ({
      ...prev,
      bio: data.bio,
      image: data.image,
      coverImage: data.coverImage,
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
    <div className="mx-auto w-full">
      {/* Banniere */}
      {user.coverImage ? (
        <div
          className="h-48 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${user.coverImage})` }}
        />
      ) : (
        <div className="h-48 w-full bg-gradient-to-r from-primary-600 to-primary-400" />
      )}

      {/* Profil header */}
      <div className="px-4">
        <div className="-mt-16 flex items-end justify-between">
          <Avatar
            src={user.image ?? undefined}
            name={user.pseudo}
            className="h-32 w-32 text-2xl ring-4 ring-background"
          />

          {isOwnProfile ? (
            <Button variant="bordered" onPress={onOpen}>
              Modifier le profil
            </Button>
          ) : (
            <Button
              color={isFollowing ? "default" : "primary"}
              variant={isFollowing ? "bordered" : "solid"}
              isLoading={isFollowLoading}
              onPress={handleFollow}
            >
              {isFollowing ? "Ne plus suivre" : "Suivre"}
            </Button>
          )}
        </div>

        {/* Informations */}
        <div className="mt-4">
          <h1 className="text-xl font-bold">{user.pseudo}</h1>
          <p className="text-default-500">@{user.username}</p>
        </div>

        {user.bio && <p className="mt-3 text-sm">{user.bio}</p>}

        <p className="mt-2 text-sm text-default-400">
          Rejoint le {formatDate(user.createdAt)}
        </p>

        {/* Stats */}
        <div className="mt-3 flex gap-4">
          <span className="text-sm">
            <span className="font-bold">{user._count.following}</span>{" "}
            <span className="text-default-500">abonnements</span>
          </span>
          <span className="text-sm">
            <span className="font-bold">{followersCount}</span>{" "}
            <span className="text-default-500">abonnés</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        aria-label="Profil"
        variant="underlined"
        classNames={{
          tabList:
            "mt-6 w-full border-b border-default-200 gap-0 px-0",
          tab: "flex-1 h-12",
          cursor: "bg-primary",
        }}
      >
        <Tab key="posts" title="Posts">
          <div className="space-y-4 p-4">
            {user.tweets.length === 0 ? (
              <p className="py-8 text-center text-default-400">
                Aucun post pour le moment
              </p>
            ) : (
              user.tweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="rounded-lg border border-default-200 p-4"
                >
                  <p>{tweet.content}</p>
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
          <div className="space-y-4 p-4">
            {user.comments.length === 0 ? (
              <p className="py-8 text-center text-default-400">
                Aucune réponse pour le moment
              </p>
            ) : (
              user.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-default-200 p-4"
                >
                  <p className="text-xs text-default-400">
                    En réponse à un tweet
                  </p>
                  <p className="mt-1 text-sm text-default-500 italic">
                    &quot;{comment.tweet.content}&quot;
                  </p>
                  <p className="mt-2">{comment.content}</p>
                  <p className="mt-2 text-sm text-default-400">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Tab>

        <Tab key="likes" title="J'aime">
          <div className="space-y-4 p-4">
            {user.likes.length === 0 ? (
              <p className="py-8 text-center text-default-400">
                Aucun j&apos;aime pour le moment
              </p>
            ) : (
              user.likes.map((like) => (
                <div
                  key={like.id}
                  className="rounded-lg border border-default-200 p-4"
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
                  <p className="mt-2">{like.tweet.content}</p>
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
          currentCoverImage={user.coverImage}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
