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
        const tweets = await prisma.tweet.findMany({
            where: { userId: userId },
            orderBy: { createdAt: "desc" },
            include: {
                user: true,
                _count: {
                    select: { likes: true, comments: true }
                },
                likes: {
                    where: { userId: session.user.id }
                }
            }
        });
        return NextResponse.json(tweets, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tweets" }, { status: 500 });
    }
}