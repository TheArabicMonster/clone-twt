import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  const session = await auth();
  // Vérifier si l'utilisateur est authentifié
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Récupérer les données du body de la requête
  const { pseudo, bio, image } = await req.json();

  // Mettre à jour les informations de l'utilisateur dans la base de données
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { pseudo, bio, image },
  });

  return NextResponse.json(user);
}