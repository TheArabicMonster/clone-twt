import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimits } from "@/lib/rate-limit";
export async function GET() {
    const session = await auth();
    if(!session?.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const limited = rateLimits.read(session.user.id, "tweets:GET");
    if (limited) return limited;
    try{
        const tweets = await prisma.tweet.findMany({
            orderBy: { createdAt: "desc" },
            take: 25,
            include: {
                user: true,
                _count: {
                    select: { likes: true, comments: true }
                },
                likes: {
                where: { userId: session.user.id }
                }
            }
        })
        return NextResponse.json(tweets);
    }catch(error){
        return NextResponse.json({ error: "Failed to fetch tweets" }, { status: 500 });
    }
}
export async function POST(request: Request) {
    const session = await auth();
    if(!session?.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const limited = rateLimits.write(session.user.id, "tweets:POST");
    if (limited) return limited;
    const { content } = await request.json();
    //Validation
    if(typeof content !== "string" || content.length === 0 || content.length > 350){
        return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    //créer le tweet dans la DB
    try{
        const tweet=await prisma.tweet.create({
            data:{
                content: content,
                userId: session.user.id
            }
        })
        return NextResponse.json({ message: "Tweet created successfully", tweet }, { status: 201 });
    } catch(error){
        return NextResponse.json({ error: "Failed to create tweet" }, { status: 500 });
    }
}