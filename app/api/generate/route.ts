import Replicate from "replicate";
import {NextResponse} from "next/server";
import {ROOMIFY_NEGATIVE_PROMPT, ROOMIFY_RENDER_PROMPT} from "@/lib/constants";
import {supabase} from "@/lib/supabase";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const {
            image,
            prompt,
            project_id,
            projectName,
            styleKeywords,
            styleId,
            projectContext,
            contextId,
            forceNew
        } = await req.json();

        if (!image) {
            return NextResponse.json({error: "Image is required"}, {status: 400});
        }

        // 1. Check Before Render: Check if an exact match exists
        const query = supabase
            .from("renders")
            .select("*")
            .eq("style_id", styleId || "")
            .eq("project_context", projectContext || "");

        if (project_id) {
            query.eq("project_id", project_id);
        } else {
            query.eq("source_image_url", image);
        }

        const {data: existingRender} = await query
            .order("created_at", {ascending: false})
            .limit(1)
            .maybeSingle();

        // Case 1: forceNew is false: If a matching record exists and its status is succeeded, return it immediately
        if (!forceNew && existingRender && existingRender.status === "succeeded") {
            // Cache Hit: Return existing record directly
            return NextResponse.json({
                ...existingRender,
                id: existingRender.prediction_id, // Keep compatibility with frontend
                output: existingRender.rendered_image_url,
                isCacheHit: true
            }, {status: 200});
        }

        let finalPrompt = prompt || ROOMIFY_RENDER_PROMPT;

        // Apply Project Context logic
        if (projectContext) {
            const contextInstruction = `This is a comprehensive ${projectContext} layout. Identify each specific zone (Bedroom, Kitchen, Living, Bath) based on the icons and architectural lines in the plan. Apply a consistent design aesthetic across all areas to ensure a unified design.`;
            finalPrompt = `${finalPrompt}\n\nCONTEXT: ${contextInstruction}`;

            if (contextId === "full-apartment") {
                finalPrompt = `${finalPrompt}\nSMART MAPPING: Use consistent flooring (e.g., matching wood or tile) throughout the entire floor plan to create a flow between spaces.`;
            }
        }

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
                condition_scale: 0.42,
                num_inference_steps: 50,
                guidance_scale: 10,
                scheduler: "K_EULER_ANCESTRAL",
                seed: Math.floor(Math.random() * 1000000),
            },
        });

        // Replicate trả về object prediction ngay lập tức
        if (prediction?.error) {
            console.error("Replicate internal error:", prediction.error);
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        // Save to Supabase (Upsert logic)
        const {data: {user}} = await (await import("@/lib/supabase-server")).getServerUser();

        const renderData = {
            prediction_id: prediction.id,
            project_id: project_id,
            project_name: projectName || "Untitled Project",
            source_image_url: image,
            status: prediction.status,
            prompt: finalPrompt,
            style_id: styleId,
            project_context: projectContext,
            user_id: user?.id,
            rendered_image_url: null, // Clear old results if updating
            upscaled_image_url: null,
            upscale_prediction_id: null
        };

        let supabaseError;

        if (existingRender) {
            // Case 2: forceNew is true or status wasn't succeeded: update existing record
            const {error} = await supabase
                .from("renders")
                .update(renderData)
                .eq("id", existingRender.id);
            supabaseError = error;
        } else {
            // Logic for New Records: no matching record found
            const {error} = await supabase
                .from("renders")
                .insert(renderData);
            supabaseError = error;
        }

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