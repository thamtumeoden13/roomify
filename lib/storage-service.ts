import {v2 as cloudinary} from 'cloudinary';
import {Readable} from 'stream';
import {uploadToDrive, downloadFromDrive} from './google-drive';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image buffer to both Cloudinary and Google Drive.
 */
export async function smartUpload(buffer: Buffer, fileName: string, mimeType: string) {
    // 1. Upload to Cloudinary
    const cloudinaryUpload = new Promise<{ secure_url: string, public_id: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'roomify',
                tags: ['roomify', 'production'],
                resource_type: 'auto',
                public_id: `${fileName.split('.')[0]}-${Date.now()}`,
            },
            (error, result) => {
                if (error) reject(error);
                else if (result) resolve(result);
                else reject(new Error('Cloudinary upload result is undefined'));
            }
        );
        Readable.from(buffer).pipe(uploadStream);
    });

    // 2. Upload to Google Drive
    const googleDriveUpload = uploadToDrive(buffer, fileName, mimeType)
        .catch(error => {
            console.error('Google Drive upload error:', error);
            return null;
        });

    const [cloudinaryResult, driveResult] = await Promise.allSettled([cloudinaryUpload, googleDriveUpload]);

    let cloudinaryUrl = '';
    let cloudinaryId = '';
    let driveUrl = '';
    let driveId = '';

    if (cloudinaryResult.status === 'fulfilled') {
        cloudinaryUrl = cloudinaryResult.value.secure_url;
        cloudinaryId = cloudinaryResult.value.public_id;
    }

    if (driveResult.status === 'fulfilled' && driveResult.value) {
        driveUrl = driveResult.value.webViewLink || '';
        driveId = driveResult.value.id || '';
    }

    return {
        cloudinaryUrl,
        cloudinaryId,
        driveUrl,
        driveId,
    };
}

/**
 * Re-caches an image from Google Drive to Cloudinary.
 */
export async function reCacheImage(driveFileId: string, fileName: string) {
    try {
        const {buffer, mimeType} = await downloadFromDrive(driveFileId);
        return await smartUpload(buffer, fileName, mimeType);
    } catch (error) {
        console.error('Re-cache error:', error);
        return null;
    }
}

/**
 * Deletes an image from Cloudinary.
 */
export async function deleteFromCloudinary(publicId: string) {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary deletion error:', error);
    }
}

export async function hybridUpload(imageUrl: string, fileName: string) {
    console.log(`Starting hybrid upload for ${fileName} from ${imageUrl}`);

    let buffer: Buffer;
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('Error fetching image from Replicate:', error);
        throw error; // If we can't get the buffer, we can't upload anywhere
    }

    const results = {
        cloudinaryUrl: '',
        driveUrl: '',
        driveFileId: '',
    };

    // Upload to Cloudinary
    const cloudinaryPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'roomify',
                tags: ['roomify', 'replicate'],
                resource_type: 'auto',
                fetch_format: 'auto', // Tự động chuyển sang WebP/AVIF tùy trình duyệt
                quality: 'auto',      // Tự động nén dung lượng mà không giảm chất lượng nhìn thấy
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    resolve(null); // Resolve with null to not break Promise.all if I used it, but I'll handle separately
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(buffer);
    });

    // Upload to Google Drive
    const drivePromise = uploadToDrive(buffer, fileName, 'image/png')
        .catch(error => {
            console.error('Google Drive upload error:', error);
            return null;
        });

    // Execute both
    const [cloudinaryResult, driveResult] = await Promise.all([
        cloudinaryPromise,
        drivePromise,
    ]);

    if (cloudinaryResult && typeof cloudinaryResult === 'object' && 'secure_url' in cloudinaryResult) {
        results.cloudinaryUrl = (cloudinaryResult as any).secure_url;
    }

    if (driveResult) {
        results.driveUrl = driveResult.webViewLink || '';
        results.driveFileId = driveResult.id || '';
    }

    return results;
}
