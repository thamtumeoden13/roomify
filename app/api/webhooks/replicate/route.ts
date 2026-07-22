import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {Webhook} from "standardwebhooks";
import {smartUpload} from "@/lib/storage-service";

// Use service role key for webhooks to bypass RLS
// Fallback to anon key if service role key is missing to avoid "supabaseKey is required" error
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

export async function POST(req: Request) {
    try {
        const WEBHOOK_SECRET = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;

        // Read raw body first (can only read once)
        const body = await req.text();

        if (WEBHOOK_SECRET) {
            // Verify signature when secret is configured
            const webhookId = req.headers.get("webhook-id");
            const webhookTimestamp = req.headers.get("webhook-timestamp");
            const webhookSignature = req.headers.get("webhook-signature");

            if (!webhookId || !webhookTimestamp || !webhookSignature) {
                console.error("Missing webhook headers");
                return NextResponse.json({error: "Missing webhook headers"}, {status: 401});
            }

            const wh = new Webhook(WEBHOOK_SECRET);
            try {
                wh.verify(body, {
                    "webhook-id": webhookId,
                    "webhook-timestamp": webhookTimestamp,
                    "webhook-signature": webhookSignature,
                });
            } catch (err) {
                console.error("Webhook verification failed:", err);
                return NextResponse.json({error: "Invalid signature"}, {status: 401});
            }
        } else {
            console.warn("REPLICATE_WEBHOOK_SIGNING_SECRET not set — skipping signature verification");
        }

        // Parse body
        const data = JSON.parse(body);
        const {id, status, output, error: replicateError} = data;

        console.log(`Received verified webhook for prediction ${id} with status ${status}`);

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Webhook updates might fail due to RLS.");
        }

        if (status === "succeeded") {
            const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;

            // Check if this is an upscale prediction
            const {data: upscaleRecord, error: upscaleFetchError} = await supabaseAdmin
                .from("renders")
                .select("id, project_id, view_id")
                .eq("upscale_prediction_id", id)
                .maybeSingle();

            if (upscaleFetchError) console.error("Error fetching upscale record:", upscaleFetchError);

            if (upscaleRecord) {
                console.log(`Processing upscale success for prediction ${id}, project ${upscaleRecord.project_id}`);
                // Handle upscale success
                const uploadResult = await handleImageUpload(renderedUrl, id);
                const displayUrl = uploadResult?.cloudinaryUrl || renderedUrl;
                const publicId = uploadResult?.cloudinaryId || null;
                const backupUrl = uploadResult?.driveUrl || null;
                const driveFileId = uploadResult?.driveId || null;

                const {error: updateError} = await supabaseAdmin
                    .from("renders")
                    .upsert({
                        upscale_prediction_id: id,
                        status: status,
                        upscaled_image_url: displayUrl,
                        upscaled_cloudinary_public_id: publicId,
                        upscaled_backup_url: backupUrl,
                        upscaled_drive_file_id: driveFileId,
                        ...(!process.env.SUPABASE_SERVICE_ROLE_KEY ? {} : {error: null})
                    }, {onConflict: 'upscale_prediction_id'});

                if (updateError) console.error("Error updating upscale render:", updateError);

                if (upscaleRecord.project_id) {
                    const {error: projectUpdateError} = await supabaseAdmin
                        .from("projects")
                        .update({rendered_image_url: displayUrl})
                        .eq("id", upscaleRecord.project_id);
                    if (projectUpdateError) console.error("Error updating project thumbnail:", projectUpdateError);
                }
            } else {
                // Handle normal render success
                const {data: renderRecord, error: renderFetchError} = await supabaseAdmin
                    .from("renders")
                    .select("id, project_id, view_id")
                    .eq("prediction_id", id)
                    .maybeSingle();

                if (renderFetchError) console.error("Error fetching render record:", renderFetchError);

                console.log(`Processing render success for prediction ${id}, found record: ${!!renderRecord}`);
                const uploadResult = await handleImageUpload(renderedUrl, id);
                const displayUrl = uploadResult?.cloudinaryUrl || renderedUrl;
                const publicId = uploadResult?.cloudinaryId || null;
                const backupUrl = uploadResult?.driveUrl || null;
                const driveFileId = uploadResult?.driveId || null;

                const {error: updateError} = await supabaseAdmin
                    .from("renders")
                    .upsert({
                        prediction_id: id,
                        status: status,
                        rendered_image_url: displayUrl,
                        cloudinary_public_id: publicId,
                        backup_url: backupUrl,
                        drive_file_id: driveFileId,
                        ...(!process.env.SUPABASE_SERVICE_ROLE_KEY ? {} : {error: null})
                    }, {onConflict: 'prediction_id'});

                if (updateError) console.error("Error updating render:", updateError);

                // Only update project thumbnail for 3D plan renders (not interior views)
                const isInteriorView = renderRecord?.view_id?.startsWith('interior-');
                if (renderRecord?.project_id && !isInteriorView) {
                    const {error: projectUpdateError} = await supabaseAdmin
                        .from("projects")
                        .update({rendered_image_url: displayUrl})
                        .eq("id", renderRecord.project_id);
                    if (projectUpdateError) console.error("Error updating project thumbnail:", projectUpdateError);
                }
            }
        } else if (status === "failed") {
            const {error: updateError} = await supabaseAdmin
                .from("renders")
                .upsert({
                    status: status,
                    error: process.env.SUPABASE_SERVICE_ROLE_KEY ? (replicateError || "Prediction failed") : undefined
                }, {onConflict: id.startsWith('upscale_') ? 'upscale_prediction_id' : 'prediction_id'});
            if (updateError) console.error("Error updating failed status:", updateError);
        } else {
            // Update status for other states (starting, processing, etc.)
            const {error: updateError} = await supabaseAdmin
                .from("renders")
                .upsert({
                    status: status,
                    ...(id.includes('upscale') ? {upscale_prediction_id: id} : {prediction_id: id})
                }, {onConflict: id.includes('upscale') ? 'upscale_prediction_id' : 'prediction_id'});
            if (updateError) console.error(`Error updating status to ${status}:`, updateError);
        }

        return NextResponse.json({message: "OK"}, {status: 200});
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
