import {v2 as cloudinary} from 'cloudinary';
import { NextResponse, NextRequest } from 'next/server';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        // Récupérer le fichier depuis le formulaire
        const formData = await request.formData();
        const file = formData.get('file');

        //Vérification (présence et type)
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Convertir le fichier en buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        //Upload sur cloudinary
        const result = (await new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder: "avatars" }, (err, result) =>
            err ? reject(err) : result ? resolve(result) : reject(new Error('Upload failed')),
            )
            .end(buffer);
        })) as { secure_url: string };
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}