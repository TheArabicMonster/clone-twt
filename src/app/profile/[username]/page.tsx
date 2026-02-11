import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ProfileContent } from "@/components/ProfileContent";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      tweets: {
        orderBy: { createdAt: "desc" },
        include: {
          likes: { select: { id: true, userId: true } },
          comments: { select: { id: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          tweet: { select: { id: true, content: true } },
        },
      },
      likes: {
        orderBy: { createdAt: "desc" },
        include: {
          tweet: {
            include: {
              user: {
                select: { pseudo: true, username: true, image: true },
              },
              likes: { select: { id: true, userId: true } },
              comments: { select: { id: true } },
            },
          },
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === user.id;

  let isFollowing = false;
  if (session?.user && !isOwnProfile) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    tweets: user.tweets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    comments: user.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    likes: user.likes.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      tweet: {
        ...l.tweet,
        createdAt: l.tweet.createdAt.toISOString(),
        updatedAt: l.tweet.updatedAt.toISOString(),
      },
    })),
  };

  return (
    <div className="min-h-screen">
      <ProfileContent
        user={serializedUser}
        isOwnProfile={isOwnProfile}
        currentUserId={session?.user?.id}
        isFollowing={isFollowing}
      />
    </div>
  );
}
