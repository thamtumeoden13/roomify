import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {reCacheImage} from "@/lib/storage-service";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
    req: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        const {type} = await req.json(); // 'rendered' or 'upscaled'

        // 1. Update last_viewed_at
        const {data: render, error: fetchError} = await supabaseAdmin
            .from("renders")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !render) {
            return NextResponse.json({error: "Render not found"}, {status: 404});
        }

        const updateData: any = {
            last_viewed_at: new Date().toISOString(),
        };

        let reCacheResult = null;

        if (type === "upscaled") {
            if (!render.upscaled_image_url && render.upscaled_drive_file_id) {
                // Re-cache upscaled image
                reCacheResult = await reCacheImage(
                    render.upscaled_drive_file_id,
                    `${render.prediction_id}_upscaled.png`
                );
                if (reCacheResult) {
                    updateData.upscaled_image_url = reCacheResult.cloudinaryUrl;
                    updateData.upscaled_cloudinary_public_id = reCacheResult.cloudinaryId;
                }
            }
        } else {
            if (!render.rendered_image_url && render.drive_file_id) {
                // Re-cache normal image
                reCacheResult = await reCacheImage(
                    render.drive_file_id,
                    `${render.prediction_id}.png`
                );
                if (reCacheResult) {
                    updateData.rendered_image_url = reCacheResult.cloudinaryUrl;
                    updateData.cloudinary_public_id = reCacheResult.cloudinaryId;
                }
            }
        }

        await supabaseAdmin
            .from("renders")
            .update(updateData)
            .eq("id", id);

        return NextResponse.json({
            message: "View tracked",
            reCached: !!reCacheResult,
            url: reCacheResult?.cloudinaryUrl || null
        });
    } catch (error: any) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
