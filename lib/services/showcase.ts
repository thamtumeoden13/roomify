import {SupabaseInstance, ShowcaseItem, ServiceResponse} from "./types";

export const ShowcaseService = {
    async getGalleryItems(
        supabase: SupabaseInstance,
        options: {
            style?: string;
            page?: number;
            pageSize?: number;
        } = {}
    ): Promise<ServiceResponse<ShowcaseItem[]>> {
        const {style = "All", page = 0, pageSize = 12} = options;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        try {
            let query = supabase
                .from("showcase")
                .select("*, render:renders(*)")
                .or("is_user_public.eq.true,is_admin_approved.eq.true")
                .order("created_at", {ascending: false});

            if (style !== "All") {
                query = query.eq("renders.style_id", style.toLowerCase());
            }

            const {data, error} = await query.range(from, to);

            if (error) throw error;

            // Filter out items where render join failed (if filtering by style)
            const validData = (data as ShowcaseItem[])?.filter(item => item.render !== null) || [];

            return {data: validData, error: null};
        } catch (error) {
            console.error("Error in getGalleryItems:", error);
            return {data: null, error};
        }
    },

    async incrementViewCount(supabase: SupabaseInstance, showcaseId: string) {
        try {
            const {error} = await supabase.rpc("increment_showcase_view_count", {
                item_id: showcaseId,
            });
            if (error) throw error;
            return {error: null};
        } catch (error) {
            console.error("Error incrementing view count:", error);
            return {error};
        }
    },

    async toggleVote(supabase: SupabaseInstance, showcaseId: string, userId: string) {
        // Note: This assumes a 'votes' table or a similar logic.
        // If it's just a counter increment, we can use RPC.
        try {
            const {error} = await supabase.rpc("toggle_showcase_vote", {
                item_id: showcaseId,
                user_id: userId
            });
            if (error) throw error;
            return {error: null};
        } catch (error) {
            console.error("Error toggling vote:", error);
            return {error};
        }
    }
};
