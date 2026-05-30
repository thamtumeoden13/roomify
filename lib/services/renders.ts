import type {SupabaseInstance, Render, ServiceResponse} from "./types";

export const RenderService = {
    async getProjectRenders(
        supabase: SupabaseInstance,
        projectId: string
    ): Promise<ServiceResponse<Render[]>> {
        try {
            const {data, error} = await supabase
                .from("renders")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", {ascending: false});

            if (error) throw error;
            return {data: data as Render[], error: null};
        } catch (error) {
            console.error("Error in getProjectRenders:", error);
            return {data: null, error};
        }
    },

    async updateRenderStatus(
        supabase: SupabaseInstance,
        renderId: string,
        status: Render["status"],
        updates: Partial<Render> = {}
    ): Promise<ServiceResponse<Render>> {
        try {
            const {data, error} = await supabase
                .from("renders")
                .update({status, ...updates})
                .eq("id", renderId)
                .select()
                .single();

            if (error) throw error;
            return {data: data as Render, error: null};
        } catch (error) {
            console.error("Error in updateRenderStatus:", error);
            return {data: null, error};
        }
    },

    async getLatestSuccessfulRender(
        supabase: SupabaseInstance,
        projectId: string
    ): Promise<ServiceResponse<Render>> {
        try {
            const {data, error} = await supabase
                .from("renders")
                .select("*")
                .eq("project_id", projectId)
                .eq("status", "succeeded")
                .order("created_at", {ascending: false})
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return {data: data as Render, error: null};
        } catch (error) {
            console.error("Error in getLatestSuccessfulRender:", error);
            return {data: null, error};
        }
    }
};
