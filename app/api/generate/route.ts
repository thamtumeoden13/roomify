import Replicate from "replicate";
import {NextResponse} from "next/server";
import {ROOMIFY_RENDER_PROMPT} from "@/lib/constants";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const {image, prompt} = await req.json();

        if (!image) {
            return NextResponse.json({error: "Image is required"}, {status: 400});
        }

        // Using stability-ai/sdxl-controlnet-canny-p2 as requested or jagadeesh-kotha/room-designer
        // jagadeesh-kotha/room-designer is more specialized for rooms
        const prediction = await replicate.predictions.create({
            // model: "jagadeesh-kotha/room-designer:0529d4999f8485a3c01c0f1e737c0205562f01f4c7f07e59779e50875c7b399d",
            version: "0529d4999f8485a3c01c0f1e737c0205562f01f4c7f07e59779e50875c7b399d",
            input: {
                image: image,
                prompt: prompt || ROOMIFY_RENDER_PROMPT,
                conditioning_scale: 0.8,
                num_inference_steps: 30,
                guidance_scale: 7.5,
            },
        });

        if (prediction?.error) {
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Replicate error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
