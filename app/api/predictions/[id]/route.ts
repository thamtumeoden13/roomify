import Replicate from "replicate";
import {NextResponse} from "next/server";
import {supabase} from "@/lib/supabase";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function uploadToSupabase(url: string, predictionId: string, folder: string = 'outputs') {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        const fileExt = url.split('.').pop()?.split('?')[0] || 'png';
        const fileName = `${predictionId}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const {data, error} = await supabase.storage
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

        const {data: {publicUrl}} = supabase.storage
            .from('roomify-assets')
            .getPublicUrl(filePath);

        return publicUrl;
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
        const prediction = await replicate.predictions.get(id);

        if (prediction?.error) {
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        // Update Supabase with latest status and output
        if (prediction.status === "succeeded") {
            const output = prediction.output;
            const renderedUrl = Array.isArray(output) ? output[output.length - 1] : output;

            // Check if this is an upscale prediction
            const {data: upscaleRecord} = await supabase
                .from("renders")
                .select("id")
                .eq("upscale_prediction_id", id)
                .maybeSingle();

            if (upscaleRecord) {
                // Handle upscale success
                const permanentUrl = await uploadToSupabase(renderedUrl, id, 'outputs/upscaled');
                const finalUrl = permanentUrl || renderedUrl;

                const {data: updatedRender} = await supabase
                    .from("renders")
                    .update({
                        upscaled_image_url: finalUrl,
                    })
                    .eq("upscale_prediction_id", id)
                    .select("project_id")
                    .maybeSingle();

                if (updatedRender?.project_id) {
                    await supabase
                        .from("projects")
                        .update({rendered_image_url: finalUrl})
                        .eq("id", updatedRender.project_id);
                }
            } else {
                // Handle normal render success
                const permanentUrl = await uploadToSupabase(renderedUrl, id);
                const finalUrl = permanentUrl || renderedUrl;

                const {data: updatedRender} = await supabase
                    .from("renders")
                    .update({
                        status: prediction.status,
                        rendered_image_url: finalUrl,
                    })
                    .eq("prediction_id", id)
                    .select("project_id")
                    .maybeSingle();

                if (updatedRender?.project_id) {
                    await supabase
                        .from("projects")
                        .update({rendered_image_url: finalUrl})
                        .eq("id", updatedRender.project_id);
                }
            }
        } else if (prediction.status === "failed") {
            await supabase
                .from("renders")
                .update({
                    status: prediction.status,
                })
                .eq("prediction_id", id);
        } else {
            // Just update status
            await supabase
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
