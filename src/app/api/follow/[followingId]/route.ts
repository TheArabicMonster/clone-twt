import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimits } from '@/lib/rate-limit';
export async function POST(
    _request: Request,//'_' pour dire qu'il est intentionnellement pas utilisé (ㆆ _ ㆆ)
    { params }: { params: Promise<{followingId: string}> } //Promise pour récupérer l'id du profil à suivre depuis l'URL
){
    //Récup sessions, si pas -> 401
    const session = await auth();
    if(!session?.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const limited = rateLimits.social(session.user.id, "follow:POST");
    if (limited) return limited;
    const { followingId } = await params;

    if(followingId === session.user.id){
        return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
    }

    //Créer une relation de follow dans la base de données
    try{
        await prisma.follow.create({
            data:{
                followerId: session.user.id,
                followingId: followingId
            }
        })
        return NextResponse.json({ message: "Followed successfully" }, { status: 200 });
    }catch(error){
        return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
    }
}
export async function DELETE(
    _request: Request,//pareil que POST (ㆆ _ ㆆ)
    //Promise pour récupérer l'id du profil à unfollow depuis l'URL
    { params }: { params: Promise<{followingId: string}> }
){
    //Récup sessions, si pas -> 401
    const session = await auth();
    if(!session?.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const limited = rateLimits.social(session.user.id, "follow:DELETE");
    if (limited) return limited;
    const { followingId } = await params; 
    //Si user tente de s'unffolow lui même -> 400
    if(followingId === session.user.id){
        return NextResponse.json({ error: "You can't unfollow yourself" }, { status: 400 });
    }
    //Supprimer la relation de follow dans la base de données
    try{
        await prisma.follow.delete({
            where:{
                followerId_followingId:{
                    followerId: session.user.id,
                    followingId: followingId
                }
            }
        })
        return NextResponse.json({ message: "Unfollowed successfully" }, { status: 200 });
    }catch(error){
        return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 });
    }
}