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
        const comments = await prisma.comment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                user: true,
                tweet: {
                    include: { user: true }
                }
            }
        });
        return NextResponse.json(comments, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}
