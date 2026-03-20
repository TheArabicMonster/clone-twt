import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(_request: Request, {params}: {params: Promise<{tweetId: string}>}){
    const session = await auth();
    if(!session?.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { tweetId } = await params;
    const { content } = await _request.json();
    //validation du commentarie
    if(typeof content !== "string" || content.length === 0 || content.length > 350){
        return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }
    try{
        await prisma.comment.create({
            data:{
                content: content,
                userId: session.user.id,
                tweetId: tweetId
            }
        })
        return NextResponse.json({ message: "Comment created" }, { status: 200 });
    }catch(error){
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
export async function GET(_request: Request, { params }: { params: Promise<{ tweetId: string }> }) {
    const session = await auth();
    if(!session?.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { tweetId } = await params;
    try{
        const comments = await prisma.comment.findMany({
            where: { tweetId: tweetId },
            orderBy: { createdAt: "desc" },
            include: {
                user: true
            }
        })
        return NextResponse.json(comments, { status: 200 });
    }catch(error){
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}