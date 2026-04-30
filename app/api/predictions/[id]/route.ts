import Replicate from "replicate";
import {NextResponse} from "next/server";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

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

        return NextResponse.json(prediction);
    } catch (error: any) {
        console.error("Replicate error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}
