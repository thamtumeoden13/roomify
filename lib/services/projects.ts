import {SupabaseInstance, Project, ServiceResponse} from "./types";

export const ProjectService = {
    async getUserProjects(
        supabase: SupabaseInstance,
        userId: string,
        options: {
            page?: number;
            pageSize?: number;
        } = {}
    ): Promise<ServiceResponse<Project[]>> {
        const {page = 0, pageSize = 12} = options;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        try {
            const {data, error} = await supabase
                .from("projects")
                .select(`
            *,
            renders!project_id (
                rendered_image_url,
                upscaled_image_url,
                created_at,
                status
            )
        `)
                .eq("user_id", userId)
                .order("created_at", {ascending: false})
                .range(from, to);

            if (error) throw error;

            const processedProjects = (data as Project[]).map((project) => {
                const {displayImageUrl, isUpscaled} = this.getBestDisplayImage(project);
                return {
                    ...project,
                    display_image_url: displayImageUrl,
                    is_upscaled: isUpscaled,
                };
            });

            return {data: processedProjects, error: null};
        } catch (error) {
            console.error("Error in getUserProjects:", error);
            return {data: null, error};
        }
    },

    async getProjectDetails(
        supabase: SupabaseInstance,
        projectId: string
    ): Promise<ServiceResponse<Project>> {
        try {
            const {data, error} = await supabase
                .from("projects")
                .select(`
          *,
          renders!project_id (*)
        `)
                .eq("id", projectId)
                .single();

            if (error) throw error;
            return {data: data as Project, error: null};
        } catch (error) {
            console.error("Error in getProjectDetails:", error);
            return {data: null, error};
        }
    },

    async createProject(
        supabase: SupabaseInstance,
        params: {
            name: string;
            source_image_url: string;
            user_id: string;
        }
    ): Promise<ServiceResponse<Project>> {
        try {
            const {data, error} = await supabase
                .from("projects")
                .insert(params)
                .select()
                .single();

            if (error) throw error;
            return {data: data as Project, error: null};
        } catch (error) {
            console.error("Error in createProject:", error);
            return {data: null, error};
        }
    },

    getBestDisplayImage(project: Project): { displayImageUrl: string; isUpscaled: boolean } {
        let displayImageUrl = project.source_image_url; // Default to source
        let isUpscaled = false;

        if (project.renders && project.renders.length > 0) {
            const successfulRenders = project.renders.filter(r => r.status === 'succeeded' || r.rendered_image_url);

            if (successfulRenders.length > 0) {
                // Sort renders by created_at desc to find the latest
                const sortedRenders = [...successfulRenders].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                // Check if any render has an upscaled version
                const latestUpscaled = sortedRenders.find((r) => r.upscaled_image_url);
                const latestRender = sortedRenders[0];

                if (latestUpscaled) {
                    displayImageUrl = latestUpscaled.upscaled_image_url!;
                    isUpscaled = true;
                } else if (latestRender.rendered_image_url) {
                    displayImageUrl = latestRender.rendered_image_url;
                }
            }
        }

        return {displayImageUrl, isUpscaled};
    }
};
