import type {Metadata} from "next";
import {supabase} from "@/lib/supabase";
import SharePageClient from "./SharePageClient";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const {id} = await params;

    // Try to find if this is a showcase item first
    const {data: showcaseData} = await supabase
        .from("showcase")
        .select("*, render:renders(*)")
        .or(`id.eq.${id},render_id.eq.${id}`)
        .maybeSingle();

    let project = null;
    let selectedRender = null;

    if (showcaseData) {
        selectedRender = showcaseData.render;
        const {data: projectData} = await supabase
            .from("projects")
            .select("*")
            .eq("id", selectedRender.project_id)
            .single();
        project = projectData;
    } else {
        const {data: projectData} = await supabase
            .from("projects")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        project = projectData;

        if (project) {
            const {data: variantsData} = await supabase
                .from("renders")
                .select("*")
                .eq("project_id", project.id)
                .eq("status", "succeeded")
                .order("created_at", {ascending: false})
                .limit(1);
            if (variantsData && variantsData.length > 0) {
                selectedRender = variantsData[0];
            }
        }
    }

    if (!project) {
        return {
            title: "Project Not Found",
        };
    }

    const style = selectedRender?.style_id || "Modern";
    const userName = project.user_name || "a Roomify User";

    const title = project.name
        ? `${project.name} | 3D Design by ${userName} | Roomify`
        : `${style} 3D Interior Design | Roomify AI`;

    const description = `Experience this stunning ${style} 3D transformation on Roomify. Upload your own 2D floor plan and get a photorealistic render in seconds for free!`;
    const ogImage = selectedRender?.upscaled_image_url || selectedRender?.rendered_image_url || project.source_image_url;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: project.name,
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function SharePage({params}: Props) {
    const {id} = await params;

    // Fetch data for initial state
    const {data: showcaseData} = await supabase
        .from("showcase")
        .select("*, render:renders(*)")
        .or(`id.eq.${id},render_id.eq.${id}`)
        .maybeSingle();

    let project = null;
    let variants = [];
    let targetProjectId = null;

    if (showcaseData) {
        targetProjectId = showcaseData.render.project_id;
        const {data: projectData} = await supabase
            .from("projects")
            .select("*")
            .eq("id", targetProjectId)
            .single();
        project = projectData;
    } else {
        const {data: projectData} = await supabase
            .from("projects")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (projectData) {
            project = projectData;
            targetProjectId = id;
        }
    }

    if (targetProjectId) {
        const {data: variantsData} = await supabase
            .from("renders")
            .select("*")
            .eq("project_id", targetProjectId)
            .eq("status", "succeeded")
            .order("created_at", {ascending: false});
        variants = variantsData || [];
    }

    return (
        <SharePageClient
            id={id}
            initialProject={project}
            initialVariants={variants}
            initialShowcase={showcaseData}
        />
    );
}
