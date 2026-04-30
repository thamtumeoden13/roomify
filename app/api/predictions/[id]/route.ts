import Replicate from "replicate";
import {NextResponse} from "next/server";
import {supabase} from "@/lib/supabase";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function uploadToSupabase(url: string, predictionId: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        const fileExt = url.split('.').pop()?.split('?')[0] || 'png';
        const fileName = `${predictionId}.${fileExt}`;
        const filePath = `outputs/${fileName}`;

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

            let finalUrl = renderedUrl;
            const permanentUrl = await uploadToSupabase(renderedUrl, id);

            if (permanentUrl) {
                finalUrl = permanentUrl;
            }

            await supabase
                .from("renders")
                .update({
                    status: prediction.status,
                    rendered_image_url: finalUrl,
                })
                .eq("prediction_id", id);
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
