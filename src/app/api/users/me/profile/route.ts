import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimits } from "@/lib/rate-limit";

const updateProfileSchema = z.object({
  pseudo: z
    .string()
    .trim()
    .min(1, "Le pseudo est requis")
    .max(30, "Le pseudo ne peut pas dépasser 30 caractères"),
  bio: z
    .string()
    .trim()
    .max(350, "La bio ne peut pas dépasser 350 caractères")
    .optional()
    .default(""),
  imageData: z
    .string()
    .startsWith("data:image/", "Format d'image invalide")
    .optional(),
});

type CloudinaryUploadResponse = {
  secure_url?: string;
};

async function uploadAvatarToCloudinary(imageData: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "clone-twt/avatars";
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signaturePayload).digest("hex");

  const formData = new FormData();
  formData.append("file", imageData);
  formData.append("api_key", apiKey);
  formData.append("timestamp", `${timestamp}`);
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const uploaded = (await response.json()) as CloudinaryUploadResponse;

  if (!uploaded.secure_url) {
    throw new Error("Cloudinary did not return secure_url");
  }

  return uploaded.secure_url;
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = rateLimits.profile(session.user.id);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { pseudo, bio, imageData } = parsed.data;
    const dataToUpdate: { pseudo: string; bio: string; image?: string } = {
      pseudo,
      bio,
    };

    if (imageData) {
      const uploadedImageUrl = await uploadAvatarToCloudinary(imageData);
      dataToUpdate.image = uploadedImageUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        pseudo: true,
        bio: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Impossible de mettre à jour le profil" },
      { status: 500 },
    );
  }
}
