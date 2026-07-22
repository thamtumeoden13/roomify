import Replicate from "replicate";
import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {reCacheImage, smartUpload} from "@/lib/storage-service";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Use service role key to bypass RLS for server-side updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function handleImageUpload(url: string, predictionId: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileExt = url.split('.').pop()?.split('?')[0] || 'png';
        const fileName = `${predictionId}.${fileExt}`;
        const mimeType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

        return await smartUpload(buffer, fileName, mimeType);
    } catch (e) {
        console.error("Upload process error:", e);
        return null;
    }
}

export async function GET(
    req: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;

        // 1. Fetch from DB first to check for hybrid storage state
        const {data: existingRender} = await supabaseAdmin
            .from("renders")
            .select("*")
            .or(`prediction_id.eq.${id},upscale_prediction_id.eq.${id}`)
            .maybeSingle();

        // Update last_viewed_at
        if (existingRender) {
            await supabaseAdmin
                .from("renders")
                .update({last_viewed_at: new Date().toISOString()})
                .eq("id", existingRender.id);

            // Check if it's an old render that was cleaned up
            const isUpscale = existingRender.upscale_prediction_id === id;
            const currentUrl = isUpscale ? existingRender.upscaled_image_url : existingRender.rendered_image_url;
            const backupUrl = isUpscale ? existingRender.upscaled_backup_url : existingRender.backup_url;
            const driveFileId = isUpscale ? existingRender.upscaled_drive_file_id : existingRender.drive_file_id;

            if (!currentUrl && backupUrl && driveFileId) {
                console.log(`Re-caching image for prediction ${id} from Drive`);
                try {
                    const fileName = `${id}.png`;
                    const cacheResult = await reCacheImage(driveFileId, fileName);

                    if (cacheResult) {
                        const updateData: any = isUpscale ? {
                            upscaled_image_url: cacheResult.cloudinaryUrl,
                            upscaled_cloudinary_public_id: cacheResult.cloudinaryId
                        } : {
                            rendered_image_url: cacheResult.cloudinaryUrl,
                            cloudinary_public_id: cacheResult.cloudinaryId
                        };

                        await supabaseAdmin
                            .from("renders")
                            .update(updateData)
                            .eq("id", existingRender.id);

                        // Return the updated data immediately to avoid waiting for Replicate if it's already finished
                        if (existingRender.status === "succeeded") {
                            return NextResponse.json({
                                ...existingRender,
                                ...updateData,
                                status: "succeeded",
                                output: cacheResult.cloudinaryUrl
                            });
                        }
                    }
                } catch (cacheError) {
                    console.error("Failed to re-cache from Drive:", cacheError);
                }
            }
        }

        const prediction = await replicate.predictions.get(id);

        if (prediction?.error) {
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        // Update Supabase with latest status and output
        if (prediction.status === "succeeded") {
            const output = prediction.output;
            const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;

            // Check if this is an upscale prediction
            const {data: upscaleRecord} = await supabaseAdmin
                .from("renders")
                .select("id")
                .eq("upscale_prediction_id", id)
                .maybeSingle();

            if (upscaleRecord) {
                // Handle upscale success
                const uploadResult = await handleImageUpload(renderedUrl, id);
                const displayUrl = uploadResult?.cloudinaryUrl || renderedUrl;
                const publicId = uploadResult?.cloudinaryId || null;
                const backupUrl = uploadResult?.driveUrl || null;
                const driveFileId = uploadResult?.driveId || null;

                const {data: updatedRender} = await supabaseAdmin
                    .from("renders")
                    .update({
                        upscaled_image_url: displayUrl,
                        upscaled_cloudinary_public_id: publicId,
                        upscaled_backup_url: backupUrl,
                        upscaled_drive_file_id: driveFileId,
                    })
                    .eq("upscale_prediction_id", id)
                    .select("project_id")
                    .maybeSingle();

                if (updatedRender?.project_id) {
                    await supabaseAdmin
                        .from("projects")
                        .update({rendered_image_url: displayUrl})
                        .eq("id", updatedRender.project_id);
                }
            } else {
                // Handle normal render success
                const uploadResult = await handleImageUpload(renderedUrl, id);
                const displayUrl = uploadResult?.cloudinaryUrl || renderedUrl;
                const publicId = uploadResult?.cloudinaryId || null;
                const backupUrl = uploadResult?.driveUrl || null;
                const driveFileId = uploadResult?.driveId || null;

                const {data: updatedRender} = await supabaseAdmin
                    .from("renders")
                    .update({
                        status: prediction.status,
                        rendered_image_url: displayUrl,
                        cloudinary_public_id: publicId,
                        backup_url: backupUrl,
                        drive_file_id: driveFileId,
                    })
                    .eq("prediction_id", id)
                    .select("project_id")
                    .maybeSingle();

                if (updatedRender?.project_id) {
                    await supabaseAdmin
                        .from("projects")
                        .update({rendered_image_url: displayUrl})
                        .eq("id", updatedRender.project_id);
                }
            }
        } else if (prediction.status === "failed") {
            await supabaseAdmin
                .from("renders")
                .update({
                    status: prediction.status,
                })
                .eq("prediction_id", id);
        } else {
            // Just update status
            await supabaseAdmin
                .from("renders")
                .update({
                    status: prediction.status,
                })
                .eq("prediction_id", id);
        }

        return NextResponse.json(prediction);
    } catch (error: any) {
        console.error("Replicate error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
