import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimits } from "@/lib/rate-limit";
export async function POST(_request: Request, {params }: { params: Promise<{ tweetId: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const limited = rateLimits.social(session.user.id, "like:POST");
    if (limited) return limited;
    const { tweetId } = await params;
    try {
        await prisma.like.create({
            data: {
                userId: session.user.id,
                tweetId: tweetId
            }
        });
        return NextResponse.json({ message: "Tweet liké" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to like" }, { status: 500 });
    }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ tweetId: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const limited = rateLimits.social(session.user.id, "like:DELETE");
    if (limited) return limited;
    const { tweetId } = await params;
    try {
        await prisma.like.delete({
            where: {
                userId_tweetId: {
                    userId: session.user.id,    
                    tweetId: tweetId
                }
            }
        });
        return NextResponse.json({ message: "Tweet disliké" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
    }
}