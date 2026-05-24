import {ImageResponse} from "next/og";
import {supabase} from "@/lib/supabase";

export const runtime = "edge";

export const alt = "Roomify AI 3D Transformation";
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default async function Image({params}: { params: { id: string } }) {
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
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 48,
                        background: "white",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    Project Not Found
                </div>
            ),
            {...size}
        );
    }

    const imageUrl = selectedRender?.upscaled_image_url || selectedRender?.rendered_image_url || project.source_image_url;
    const projectName = project.name || "My Room Transformation";
    const style = selectedRender?.style_id || "Modern";

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f9fafb",
                    backgroundImage: "linear-gradient(to bottom right, #f9fafb, #f3f4f6)",
                    padding: "40px",
                    position: "relative",
                }}
            >
                {/* Branding */}
                <div
                    style={{
                        position: "absolute",
                        top: "40px",
                        left: "40px",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#3b82f6",
                            borderRadius: "8px",
                            marginRight: "12px",
                        }}
                    />
                    <span
                        style={{
                            fontSize: "24px",
                            fontWeight: "bold",
                            color: "#111827",
                        }}
                    >
            Roomify
          </span>
                </div>

                {/* AI Badge */}
                <div
                    style={{
                        position: "absolute",
                        top: "40px",
                        right: "40px",
                        backgroundColor: "#e0f2fe",
                        color: "#0369a1",
                        padding: "8px 16px",
                        borderRadius: "9999px",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "flex",
                    }}
                >
                    AI 3D Transformation
                </div>

                {/* Main Content */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        marginTop: "40px",
                    }}
                >
                    <div
                        style={{
                            width: "800px",
                            height: "400px",
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            display: "flex",
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt={projectName}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </div>

                    <div
                        style={{
                            marginTop: "32px",
                            fontSize: "48px",
                            fontWeight: "bold",
                            color: "#111827",
                            textAlign: "center",
                            display: "flex",
                        }}
                    >
                        {projectName}
                    </div>

                    <div
                        style={{
                            marginTop: "8px",
                            fontSize: "24px",
                            color: "#6b7280",
                            display: "flex",
                        }}
                    >
                        {style} Interior Design
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
