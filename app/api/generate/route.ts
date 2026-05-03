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
            project_id,
            projectName,
            styleKeywords,
            styleId,
            projectContext,
            contextId,
            flooringKeywords,
            flooringId,
            lightingKeywords,
            lightingId,
            forceNew
        } = await req.json();

        if (!image) {
            return NextResponse.json({error: "Image is required"}, {status: 400});
        }

        // 1. Check Cache
        const query = supabase
            .from("renders")
            .select("*")
            .eq("style_id", styleId || "")
            .eq("project_context", contextId || "")
            .eq("flooring_id", flooringId || "")
            .eq("lighting_id", lightingId || "");

        if (project_id) {
            query.eq("project_id", project_id);
        } else {
            query.eq("source_image_url", image);
        }

        const {data: existingRender} = await query
            .order("created_at", {ascending: false})
            .limit(1)
            .maybeSingle();

        const {data: {user}} = await (await import("@/lib/supabase-server")).getServerUser();
        if (!user) {
            return NextResponse.json({error: "Authentication required"}, {status: 401});
        }

        if (!forceNew && existingRender && existingRender.status === "succeeded") {
            return NextResponse.json({
                ...existingRender,
                id: existingRender.prediction_id,
                output: existingRender.rendered_image_url,
                isCacheHit: true
            }, {status: 200});
        }

        // 2. Credit Check
        const {data: profile} = await supabase.from("profiles").select("credits").eq("id", user.id).single();
        if (!profile || profile.credits < 1) {
            return NextResponse.json({error: "You have run out of credits."}, {status: 403});
        }

        // 3. XÂY DỰNG MASTER PROMPT (KẾT HỢP CẢ HAI)
        const fKeywords = flooringKeywords || "natural wood flooring";
        const lKeywords = lightingKeywords || "soft natural daylight";

        // Chúng ta đưa ROOMIFY_RENDER_PROMPT lên đầu làm "Luật",
        // sau đó mới đưa các yêu cầu cụ thể của người dùng xuống dưới.
        const masterPrompt = `
${ROOMIFY_RENDER_PROMPT}

ADDITIONAL DESIGN SPECIFICATIONS:
- Project Context: This is a ${projectContext || "comprehensive apartment"} layout. 
- Interior Style: ${styleKeywords || "Modern minimalist"}
- Material Choice: Use ${fKeywords} for all floor surfaces.
- Lighting Mood: The scene is bathed in ${lKeywords}.

FINAL REQUIREMENT: Ensure all 3D furniture and walls strictly align with the 2D plan lines. Completely hide and replace all floor text labels with the selected ${fKeywords}.
`.trim();

        // 4. Smart Tuning
        let guidanceScale = 10;
        if (flooringId === "white-marble" || flooringId === "polished-concrete") {
            guidanceScale = 12; // Tăng để làm rõ độ bóng của đá/bê tông
        } else if (styleId === "japandi" || styleId === "vintage") {
            guidanceScale = 9; // Giảm để tạo độ mềm mại tự nhiên
        }

        // 5. Khởi tạo prediction
        const prediction = await replicate.predictions.create({
            version: "06d6fae3b75ab68a28cd2900afa6033166910dd09fd9751047043a5bbb4c184b",
            input: {
                image: image,
                prompt: masterPrompt,
                negative_prompt: ROOMIFY_NEGATIVE_PROMPT,
                condition_scale: 0.45, // Tăng nhẹ lên 0.45 để giữ tường chắc chắn hơn khi có nhiều vật liệu
                num_inference_steps: 50,
                guidance_scale: guidanceScale,
                scheduler: "K_EULER_ANCESTRAL",
                seed: Math.floor(Math.random() * 1000000),
            },
        });

        if (prediction?.error) {
            return NextResponse.json({error: prediction.error}, {status: 500});
        }

        // 6. Trừ credit và lưu database
        await supabase.rpc("decrement_credits", {target_user_id: user.id, amount: 1});

        const renderData = {
            prediction_id: prediction.id,
            project_id: project_id,
            project_name: projectName || "Untitled Project",
            source_image_url: image,
            status: prediction.status,
            prompt: masterPrompt,
            style_id: styleId,
            project_context: contextId,
            flooring_id: flooringId,
            lighting_id: lightingId,
            user_id: user?.id,
            rendered_image_url: null,
            upscaled_image_url: null
        };

        if (existingRender) {
            await supabase.from("renders").update(renderData).match({id: existingRender.id});
        } else {
            await supabase.from("renders").insert(renderData);
        }

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Replicate error logic:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}