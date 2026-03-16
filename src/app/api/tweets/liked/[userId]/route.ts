import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = await params;
    try {
        // Retrieve the likes of the target user, ordered by like date descending.
        // This gives us the tweetIds in the correct order.
        const userLikes = await prisma.like.findMany({
            where: { userId: userId },
            orderBy: { createdAt: "desc" },
            select: { tweetId: true }
        });

        const tweetIds = userLikes.map((like) => like.tweetId);

        // Fetch the tweets preserving the like-date order.
        const tweetsUnordered = await prisma.tweet.findMany({
            where: { id: { in: tweetIds } },
            include: {
                user: true,
                _count: { select: { likes: true, comments: true } },
                likes: { where: { userId: session.user.id } }
            }
        });

        // Re-apply the like-date ordering (MongoDB does not guarantee in-list ordering).
        const tweetMap = new Map(tweetsUnordered.map((tweet) => [tweet.id, tweet]));
        const tweets = tweetIds.map((id) => tweetMap.get(id)).filter(Boolean);
        return NextResponse.json(tweets, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch liked tweets" }, { status: 500 });
    }
}
