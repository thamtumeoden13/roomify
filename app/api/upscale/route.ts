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

        // --- CREDIT CHECK ---
        const {data: {user}} = await (await import("@/lib/supabase-server")).getServerUser();

        if (!user) {
            return NextResponse.json({error: "Authentication required"}, {status: 401});
        }

        const {data: profile, error: profileError} = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            console.error("Profile fetch error:", profileError);
            return NextResponse.json({error: "Could not verify user credits"}, {status: 500});
        }

        if (profile.credits < 2) {
            return NextResponse.json({
                error: "You need at least 2 credits to upscale. Please contact support or wait for a top-up."
            }, {status: 403});
        }
        // --- END CREDIT CHECK ---

        // Initialize upscale prediction
        const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/replicate`;
        const prediction = await replicate.predictions.create({
            version: "3febd19381dd7e1f52a3ed3260b5b0a5636353de45e37e7c1c3cd814b24077a3",
            input: {
                image: image,
                scale: 4,
                face_enhance: false,
            },
            webhook: webhookUrl,
            webhook_events_filter: ["completed"],
        });

        if (prediction?.error) {
            console.error("Replicate internal error:", prediction.error);
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        // Decrement credits after successful prediction creation
        const {error: decrementError} = await supabase.rpc("decrement_credits", {
            target_user_id: user.id,
            amount: 2
        });

        if (decrementError) {
            console.error("Credit decrement error:", decrementError);
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
