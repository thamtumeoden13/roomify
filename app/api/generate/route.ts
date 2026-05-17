import Replicate from "replicate";
import {NextResponse} from "next/server";
import {
    CAMERA_VIEWS,
    FLOORING_MATERIALS,
    LIGHTING_MOODS,
    PROJECT_CONTEXTS,
    ROOM_STYLES,
    ROOMIFY_RENDER_PROMPT
} from "@/lib/constants";
import {supabase} from "@/lib/supabase";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const {
            image, project_id, projectName, styleKeywords, styleId,
            projectContext, contextId, flooringKeywords, flooringId,
            lightingKeywords, lightingId, viewKeywords, viewId = "plan", forceNew
        } = await req.json();

        if (!image) return NextResponse.json({error: "Image is required"}, {status: 400});

        // 1. Check Cache Logic (giữ nguyên như cũ)
        const query = supabase.from("renders").select("*")
            .eq("style_id", styleId || "").eq("project_context", contextId || "")
            .eq("flooring_id", flooringId || "").eq("lighting_id", lightingId || "")
            .eq("view_id", viewId);
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

        // 3. THIẾT LẬP CHIẾN THUẬT RENDER
        // Find objects from constants based on IDs or fallback to [0]
        const selectedStyle = ROOM_STYLES.find(s => s.id === styleId) || ROOM_STYLES[0];
        const selectedContext = PROJECT_CONTEXTS.find(c => c.id === contextId) || PROJECT_CONTEXTS[0];
        const selectedFlooring = FLOORING_MATERIALS.find(f => f.id === flooringId) || FLOORING_MATERIALS[0];
        const selectedLighting = LIGHTING_MOODS.find(l => l.id === lightingId) || LIGHTING_MOODS[0];
        const selectedView = CAMERA_VIEWS.find(v => v.id === viewId) || CAMERA_VIEWS[0];

        // Split ROOMIFY_RENDER_PROMPT into its structural parts
        // Based on constants.ts, it has sections: 3D STRUCTURE, FURNITURE, SURFACE CLEANUP, QUALITY, FINAL EXECUTION
        const promptParts = ROOMIFY_RENDER_PROMPT.split('\n');
        const structureFurniture = promptParts.filter(line => line.startsWith('3D STRUCTURE:') || line.startsWith('FURNITURE:')).join(' ');
        const qualityCleanup = promptParts.filter(line => line.startsWith('SURFACE CLEANUP:') || line.startsWith('QUALITY:') || line.startsWith('FINAL EXECUTION:')).join(' ');

        const masterPrompt = `
            ${selectedView.keywords}
            ${structureFurniture}
            STYLE: ${selectedStyle.keywords}
            MATERIALS: The entire floor is a solid slab of ${selectedFlooring.keywords}.
            LIGHTING: ${selectedLighting.keywords}
            ${qualityCleanup}
        `.trim().replace(/\s+/g, ' ');

        // 5. Khởi tạo Prediction với google/nano-banana
        // Model uses image_input as an array of strings
        const prediction = await replicate.predictions.create({
            model: "google/nano-banana",
            input: {
                image_input: [image],
                prompt: masterPrompt,
                aspect_ratio: "match_input_image",
                output_format: "png",
            },
        });

        if (prediction?.error) return NextResponse.json({error: prediction.error}, {status: 500});

        // 6. Database & Credits Update
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
            view_id: viewId,
            user_id: user?.id,
            seed: null, // Handle missing seed gracefully
            rendered_image_url: null,
            upscaled_image_url: null
        };
        if (existingRender) await supabase.from("renders").update(renderData).match({id: existingRender.id});
        else await supabase.from("renders").insert(renderData);

        return NextResponse.json(prediction, {status: 201});
    } catch (error: any) {
        console.error("Replicate API Error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}