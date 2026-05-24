import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

// Use service role key for webhooks to bypass RLS
// Fallback to anon key if service role key is missing to avoid "supabaseKey is required" error
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function uploadToSupabase(url: string, predictionId: string, folder: string = 'outputs') {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        const fileExt = url.split('.').pop()?.split('?')[0] || 'png';
        const fileName = `${predictionId}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const {data, error} = await supabaseAdmin.storage
            .from('roomify-assets')
            .upload(filePath, blob, {
                contentType: blob.type,
                upsert: true,
                cacheControl: '3600'
            });

        if (error) {
            console.error("Supabase Storage error:", error);
            return null;
        }

        const {data: {publicUrl}} = supabaseAdmin.storage
            .from('roomify-assets')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (e) {
        console.error("Upload process error:", e);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {id, status, output, error: replicateError} = body;

        console.log(`Received webhook for prediction ${id} with status ${status}`);

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Webhook updates might fail due to RLS.");
        }

        if (status === "succeeded") {
            const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;

            // Check if this is an upscale prediction
            const {data: upscaleRecord, error: upscaleFetchError} = await supabaseAdmin
                .from("renders")
                .select("id, project_id")
                .eq("upscale_prediction_id", id)
                .maybeSingle();

            if (upscaleFetchError) console.error("Error fetching upscale record:", upscaleFetchError);

            if (upscaleRecord) {
                console.log(`Processing upscale success for prediction ${id}, project ${upscaleRecord.project_id}`);
                // Handle upscale success
                const permanentUrl = await uploadToSupabase(renderedUrl, id, 'outputs/upscaled');
                const finalUrl = permanentUrl || renderedUrl;

                const {error: updateError} = await supabaseAdmin
                    .from("renders")
                    .update({
                        status: status,
                        upscaled_image_url: finalUrl,
                        ...(!process.env.SUPABASE_SERVICE_ROLE_KEY ? {} : {error: null})
                    })
                    .eq("upscale_prediction_id", id);

                if (updateError) console.error("Error updating upscale render:", updateError);

                if (upscaleRecord.project_id) {
                    const {error: projectUpdateError} = await supabaseAdmin
                        .from("projects")
                        .update({rendered_image_url: finalUrl})
                        .eq("id", upscaleRecord.project_id);
                    if (projectUpdateError) console.error("Error updating project thumbnail:", projectUpdateError);
                }
            } else {
                // Handle normal render success
                const {data: renderRecord, error: renderFetchError} = await supabaseAdmin
                    .from("renders")
                    .select("id, project_id")
                    .eq("prediction_id", id)
                    .maybeSingle();

                if (renderFetchError) console.error("Error fetching render record:", renderFetchError);

                if (renderRecord) {
                    console.log(`Processing render success for prediction ${id}, project ${renderRecord.project_id}`);
                    const permanentUrl = await uploadToSupabase(renderedUrl, id);
                    const finalUrl = permanentUrl || renderedUrl;

                    const {error: updateError} = await supabaseAdmin
                        .from("renders")
                        .update({
                            status: status,
                            rendered_image_url: finalUrl,
                            ...(!process.env.SUPABASE_SERVICE_ROLE_KEY ? {} : {error: null})
                        })
                        .eq("prediction_id", id);

                    if (updateError) console.error("Error updating render:", updateError);

                    if (renderRecord.project_id) {
                        const {error: projectUpdateError} = await supabaseAdmin
                            .from("projects")
                            .update({rendered_image_url: finalUrl})
                            .eq("id", renderRecord.project_id);
                        if (projectUpdateError) console.error("Error updating project thumbnail:", projectUpdateError);
                    }
                } else {
                    console.warn(`No record found for prediction ID: ${id}`);
                }
            }
        } else if (status === "failed") {
            const updatePayload: any = {
                status: status
            };

            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                updatePayload.error = replicateError || "Prediction failed";
            }

            const {error: updateError} = await supabaseAdmin
                .from("renders")
                .update(updatePayload)
                .or(`prediction_id.eq.${id},upscale_prediction_id.eq.${id}`);
            if (updateError) console.error("Error updating failed status:", updateError);
        } else {
            // Update status for other states (starting, processing, etc.)
            const {error: updateError} = await supabaseAdmin
                .from("renders")
                .update({status: status})
                .or(`prediction_id.eq.${id},upscale_prediction_id.eq.${id}`);
            if (updateError) console.error(`Error updating status to ${status}:`, updateError);
        }

        return NextResponse.json({message: "OK"}, {status: 200});
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
