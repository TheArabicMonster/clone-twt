import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { username } = await params;

    if (session.user.username !== username) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { bio, image, coverImage } = body;

    const updateData: { bio?: string; image?: string; coverImage?: string } =
      {};
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    const user = await prisma.user.update({
      where: { username },
      data: updateData,
    });

    return NextResponse.json({
      bio: user.bio,
      image: user.image,
      coverImage: user.coverImage,
    });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 },
    );
  }
}
