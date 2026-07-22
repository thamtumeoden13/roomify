import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {deleteFromCloudinary} from "@/lib/storage-service";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    // Verify Cron Secret if provided
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        console.log(`Starting cleanup for renders older than ${thirtyDaysAgo.toISOString()}`);

        // Find renders that haven't been viewed for 30 days and still have Cloudinary URLs
        const {data: oldRenders, error: fetchError} = await supabaseAdmin
            .from("renders")
            .select("id, cloudinary_public_id, upscaled_cloudinary_public_id")
            .lt("last_viewed_at", thirtyDaysAgo.toISOString())
            .or("rendered_image_url.neq.null,upscaled_image_url.neq.null");

        if (fetchError) throw fetchError;

        if (!oldRenders || oldRenders.length === 0) {
            return NextResponse.json({message: "No old renders found to clean up"});
        }

        console.log(`Found ${oldRenders.length} renders to clean up`);

        let cleanedCount = 0;

        for (const render of oldRenders) {
            // Delete from Cloudinary
            if (render.cloudinary_public_id) {
                await deleteFromCloudinary(render.cloudinary_public_id);
            }
            if (render.upscaled_cloudinary_public_id) {
                await deleteFromCloudinary(render.upscaled_cloudinary_public_id);
            }

            // Update DB
            const {error: updateError} = await supabaseAdmin
                .from("renders")
                .update({
                    rendered_image_url: null,
                    upscaled_image_url: null,
                    cloudinary_public_id: null,
                    upscaled_cloudinary_public_id: null
                })
                .eq("id", render.id);

            if (!updateError) cleanedCount++;
        }

        return NextResponse.json({
            message: `Cleanup completed`,
            found: oldRenders.length,
            cleaned: cleanedCount
        });

    } catch (error: any) {
        console.error("Cleanup error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
