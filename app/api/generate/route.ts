import Replicate from "replicate";
import {NextResponse} from "next/server";
import {ROOMIFY_NEGATIVE_PROMPT} from "@/lib/constants";
import {supabase} from "@/lib/supabase";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const {
            image, project_id, projectName, styleKeywords, styleId,
            projectContext, contextId, flooringKeywords, flooringId,
            lightingKeywords, lightingId, viewKeywords, viewId, forceNew
        } = await req.json();

        if (!image) return NextResponse.json({error: "Image is required"}, {status: 400});

        // 1. Check Cache Logic (giữ nguyên như cũ)
        const query = supabase.from("renders").select("*")
            .eq("style_id", styleId || "").eq("project_context", contextId || "")
            .eq("flooring_id", flooringId || "").eq("lighting_id", lightingId || "")
            .eq("view_id", viewId || "plan");
        if (project_id) query.eq("project_id", project_id);
        else query.eq("source_image_url", image);
        const {data: existingRender} = await query.order("created_at", {ascending: false}).limit(1).maybeSingle();

        const {data: {user}} = await (await import("@/lib/supabase-server")).getServerUser();
        if (!user) return NextResponse.json({error: "Authentication required"}, {status: 401});

        if (!forceNew && existingRender && existingRender.status === "succeeded") {
            return NextResponse.json({
                ...existingRender,
                id: existingRender.prediction_id,
                output: existingRender.rendered_image_url,
                isCacheHit: true
            }, {status: 200});
        }

        // 2. Credit Check (giữ nguyên)
        const {data: profile} = await supabase.from("profiles").select("credits").eq("id", user.id).single();
        if (!profile || profile.credits < 1) return NextResponse.json({error: "Out of credits"}, {status: 403});

        // 3. THIẾT LẬP CHIẾN THUẬT RENDER DỰA TRÊN VIEW_ID
        let baseSeed = (viewId === "plan") ? 363109 : 665380;
        let basePromptAnchor = "";
        let conditionScale = 0.45;
        let guidanceScale = 12;
        let negativePromptExtension = "";

        if (viewId === "plan") {
            // VIEW PHẲNG: Tập trung vào độ chính xác mặt bằng
            basePromptAnchor = "Professional 3D floor plan, top-down orthographic view, 90-degree overhead visualization.";
            conditionScale = 0.45;
            guidanceScale = 12;
        } else if (viewId === "isometric") {
            // VIEW NGHIÊNG: Ép AI tạo mô hình sa bàn (Single Story)
            basePromptAnchor = "A professional 3D ISOMETRIC DIORAMA of a SINGLE-STORY interior, 45-degree angled view, architectural scale model, roofless cutaway.";
            conditionScale = 0.28; // Tận dụng Seed 665380 để xoay camera
            guidanceScale = 22;    // Ép AI nghe lời "Isometric"
            negativePromptExtension = ", multi-story, second floor, stairs, roof, ceiling, top-down, straight overhead";
        } else if (viewId === "perspective") {
            // VIEW CINEMATIC: Tạo chiều sâu ảnh chụp
            basePromptAnchor = "A stunning 3D perspective interior photograph, camera looking deep into the rooms, wide-angle cinematic shot, dramatic spatial volume.";
            conditionScale = 0.22; // Độ tự do cao nhất để tạo điểm tụ
            guidanceScale = 25;
            negativePromptExtension = ", flat plan, 2D layout, map view, top-down, blueprint";
        }

        // 4. LẮP GHÉP MASTER PROMPT DYNAMIC (Không dùng hằng số fixed nữa)
        const masterPrompt = `
            ${basePromptAnchor}
            Architectural visualization of a ${projectContext || "space"}.
            Interior Style: ${styleKeywords}.
            Flooring: ${flooringKeywords}.
            Lighting: ${lightingKeywords}.
            
            TECHNICAL RULES: Strictly hide all 2D labels and floor markings. 
            Replace all text with seamless ${flooringKeywords}. 
            Extrude white structural walls with consistent height. 
            Ensure photorealistic materials and soft shadows.
        `.trim().replace(/\s+/g, ' '); // Làm sạch khoảng trắng thừa

        // 5. Khởi tạo Prediction với SEED CỐ ĐỊNH 665380
        const prediction = await replicate.predictions.create({
            version: "06d6fae3b75ab68a28cd2900afa6033166910dd09fd9751047043a5bbb4c184b",
            input: {
                image: image,
                prompt: masterPrompt,
                negative_prompt: ROOMIFY_NEGATIVE_PROMPT + negativePromptExtension,
                condition_scale: conditionScale,
                num_inference_steps: 50,
                guidance_scale: guidanceScale,
                scheduler: "K_EULER_ANCESTRAL",
                seed: baseSeed,
            },
        });

        if (prediction?.error) return NextResponse.json({error: prediction.error}, {status: 500});

        // 6. Database & Credits Update (giữ nguyên)
        await supabase.rpc("decrement_credits", {target_user_id: user.id, amount: 1});
        const renderData = {
            prediction_id: prediction.id, project_id: project_id, project_name: projectName || "Untitled Project",
            source_image_url: image, status: prediction.status, prompt: masterPrompt,
            style_id: styleId, project_context: contextId, flooring_id: flooringId,
            lighting_id: lightingId, view_id: viewId || "plan", user_id: user?.id, seed: baseSeed,
            rendered_image_url: null, upscaled_image_url: null
        };
        if (existingRender) await supabase.from("renders").update(renderData).match({id: existingRender.id});
        else await supabase.from("renders").insert(renderData);

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Replicate API Error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}