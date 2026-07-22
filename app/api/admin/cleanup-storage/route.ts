import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {deleteFromCloudinary} from "@/lib/storage-service";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    try {
        // Only allow if a secret key is provided (simple security for cron job)
        const {secret} = await req.json();
        if (secret !== process.env.CLEANUP_SECRET && process.env.NODE_ENV === 'production') {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find renders that haven't been viewed for 30 days and still have Cloudinary images
        const {data: oldRenders, error} = await supabaseAdmin
            .from("renders")
            .select("*")
            .lt("last_viewed_at", thirtyDaysAgo.toISOString())
            .or("cloudinary_public_id.neq.null,upscaled_cloudinary_public_id.neq.null");

        if (error) throw error;

        let deletedCount = 0;

        for (const render of (oldRenders || [])) {
            const updates: any = {};
            let changed = false;

            // Delete normal version if it exists
            if (render.cloudinary_public_id && render.backup_url) {
                await deleteFromCloudinary(render.cloudinary_public_id);
                updates.rendered_image_url = null;
                updates.cloudinary_public_id = null;
                changed = true;
            }

            // Delete upscaled version if it exists
            if (render.upscaled_cloudinary_public_id && render.upscaled_backup_url) {
                await deleteFromCloudinary(render.upscaled_cloudinary_public_id);
                updates.upscaled_image_url = null;
                updates.upscaled_cloudinary_public_id = null;
                changed = true;
            }

            if (changed) {
                await supabaseAdmin
                    .from("renders")
                    .update(updates)
                    .eq("id", render.id);
                deletedCount++;
            }
        }

        return NextResponse.json({
            message: `Cleanup completed`,
            deletedCount
        });
    } catch (error: any) {
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
