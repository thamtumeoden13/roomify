import type {Metadata} from "next";
import {supabase} from "@/lib/supabase";
import SharePageClient from "./SharePageClient";
import {ShowcaseService} from "@/lib/services/showcase";
import {ProjectService} from "@/lib/services/projects";
import {RenderService} from "@/lib/services/renders";

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
        const {data: projectData} = await ProjectService.getProjectDetails(supabase, selectedRender.project_id);
        project = projectData;
    } else {
        const {data: projectData} = await ProjectService.getProjectDetails(supabase, id);
        project = projectData;

        if (project) {
            const {data: latestRender} = await RenderService.getLatestSuccessfulRender(supabase, project.id);
            selectedRender = latestRender;
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

    return {
        metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
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
    let variants: any[] = [];
    let targetProjectId = null;

    if (showcaseData) {
        targetProjectId = showcaseData.render.project_id;
        const {data: projectData} = await ProjectService.getProjectDetails(supabase, targetProjectId);
        project = projectData;
    } else {
        const {data: projectData} = await ProjectService.getProjectDetails(supabase, id);
        if (projectData) {
            project = projectData;
            targetProjectId = id;
        }
    }

    if (targetProjectId) {
        const {data: variantsData} = await RenderService.getProjectRenders(supabase, targetProjectId);
        variants = (variantsData || []).filter(r => r.status === 'succeeded');
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
