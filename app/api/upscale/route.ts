import Replicate from "replicate";
import {NextResponse} from "next/server";
import {supabase} from "@/lib/supabase";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const {image, renderId} = await req.json();

        if (!image) {
            return NextResponse.json({error: "Image URL is required"}, {status: 400});
        }

        if (!renderId) {
            return NextResponse.json({error: "Render ID is required"}, {status: 400});
        }

        // Check if an upscaled version already exists
        const {data: existingRender, error: fetchError} = await supabase
            .from("renders")
            .select("upscaled_image_url, upscale_prediction_id")
            .eq("id", renderId)
            .single();

        if (existingRender?.upscaled_image_url) {
            return NextResponse.json({
                status: "succeeded",
                output: existingRender.upscaled_image_url,
                alreadyExists: true,
                id: existingRender.upscale_prediction_id // For frontend compatibility
            }, {status: 200});
        }

        // Initialize upscale prediction
        const prediction = await replicate.predictions.create({
            model: "nightmareai/real-esrgan",
            input: {
                image: image,
                scale: 4,
                face_enhance: false,
            },
        });

        if (prediction?.error) {
            console.error("Replicate internal error:", prediction.error);
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        // Update the existing record with the upscale_prediction_id
        await supabase
            .from("renders")
            .update({
                upscale_prediction_id: prediction.id
            })
            .eq("id", renderId);

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Upscale error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
