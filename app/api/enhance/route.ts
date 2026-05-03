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

        // Initialize enhancement prediction (using CodeFormer for subtle enhancement)
        const prediction = await replicate.predictions.create({
            version: "cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
            input: {
                image: image,
                upscale: 1,
                face_upsample: false,
                background_enhance: true,
                codeformer_fidelity: 0.7,
            },
        });

        if (prediction?.error) {
            console.error("Replicate enhancement error:", prediction.error);
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Enhance error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
