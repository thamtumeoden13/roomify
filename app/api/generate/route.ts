import Replicate from "replicate";
import {NextResponse} from "next/server";
import {ROOMIFY_NEGATIVE_PROMPT, ROOMIFY_RENDER_PROMPT} from "@/lib/constants";
import {supabase} from "@/lib/supabase";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const {image, prompt, projectName, styleKeywords, styleId, forceNew} = await req.json();

        if (!image) {
            return NextResponse.json({error: "Image is required"}, {status: 400});
        }

        // 1. Check Before Render: Check if an exact match exists (unless forced new)
        if (!forceNew) {
            const {data: existingRender} = await supabase
                .from("renders")
                .select("*")
                .eq("source_image_url", image)
                .eq("style_id", styleId || "")
                .eq("status", "succeeded")
                .order("created_at", {ascending: false})
                .limit(1)
                .maybeSingle();

            if (existingRender) {
                // Cache Hit: Return existing record directly
                return NextResponse.json({
                    ...existingRender,
                    id: existingRender.prediction_id, // Keep compatibility with frontend
                    output: existingRender.rendered_image_url,
                    isCacheHit: true
                }, {status: 200});
            }
        }

        let finalPrompt = prompt || ROOMIFY_RENDER_PROMPT;
        if (styleKeywords) {
            finalPrompt = `${finalPrompt}\n\nSTYLE INSTRUCTIONS: ${styleKeywords}`;
        }

        // Khởi tạo prediction
        const prediction = await replicate.predictions.create({
            // Sử dụng chính xác Version ID của lucataco/sdxl-controlnet
            version: "06d6fae3b75ab68a28cd2900afa6033166910dd09fd9751047043a5bbb4c184b",
            input: {
                image: image, // Supabase public URL
                prompt: finalPrompt,
                negative_prompt: ROOMIFY_NEGATIVE_PROMPT,
                condition_scale: 0.5,
                num_inference_steps: 50,
                guidance_scale: 12,
                scheduler: "K_EULER_ANCESTRAL",
                seed: Math.floor(Math.random() * 1000000),
            },
        });

        // Replicate trả về object prediction ngay lập tức
        if (prediction?.error) {
            console.error("Replicate internal error:", prediction.error);
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        // Save to Supabase
        const {data: {user}} = await (await import("@/lib/supabase-server")).getServerUser();

        const {error: supabaseError} = await supabase.from("renders").insert({
            prediction_id: prediction.id,
            project_name: projectName || "Untitled Project",
            source_image_url: image,
            status: prediction.status,
            prompt: finalPrompt,
            style_id: styleId,
            user_id: user?.id
        });

        if (supabaseError) {
            console.error("Supabase error:", supabaseError);
            // We continue even if Supabase fails, but we might want to handle it
        }

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Replicate error logic:", error);
        // Trả về lỗi chi tiết từ Replicate nếu có
        return NextResponse.json({error: error.message}, {status: 500});
    }
}