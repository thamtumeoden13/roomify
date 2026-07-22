import {NextResponse} from 'next/server';
import {supabase} from "@/lib/supabase";
import sharp from 'sharp';
import {smartUpload} from "@/lib/storage-service";

export async function POST(request: Request): Promise<NextResponse> {
    const {searchParams} = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
        return NextResponse.json({error: 'Filename is required'}, {status: 400});
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({error: 'File is required'}, {status: 400});
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const metadata = await sharp(buffer).metadata();
        const outputFormat = (metadata.format === 'png' || metadata.format === 'webp') ? metadata.format : 'jpeg';

        // Process image: resize to max 1024px and compress
        let sharpInstance = sharp(buffer)
            .resize(1024, 1024, {
                fit: 'inside',
                withoutEnlargement: true
            });

        if (outputFormat === 'jpeg') {
            sharpInstance = sharpInstance.jpeg({quality: 80});
        } else if (outputFormat === 'png') {
            sharpInstance = sharpInstance.png({quality: 80});
        } else if (outputFormat === 'webp') {
            sharpInstance = sharpInstance.webp({quality: 80});
        }

        const processedImageBuffer = await sharpInstance.toBuffer();

        const fileExt = outputFormat;
        const fileName = `${Math.random().toString(36).slice(2, 11)}.${fileExt}`;

        // Perform dual upload to Cloudinary and Google Drive
        const uploadResult = await smartUpload(
            processedImageBuffer,
            fileName,
            `image/${outputFormat}`
        );

        // Return the Cloudinary URL for fast display
        return NextResponse.json({
            url: uploadResult.cloudinaryUrl,
            publicId: uploadResult.cloudinaryId
        });
    } catch (e: any) {
        console.error("Upload process error:", e);
        return NextResponse.json({error: e.message}, {status: 500});
    }
}
