import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { username } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    if (session.user.id === targetUser.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous suivre vous-même" },
        { status: 400 },
      );
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      });
    }

    const followersCount = await prisma.follow.count({
      where: { followingId: targetUser.id },
    });

    return NextResponse.json({
      following: !existingFollow,
      followersCount,
    });
  } catch (error) {
    console.error("Erreur follow:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}
