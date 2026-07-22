import {SupabaseClient} from "@supabase/supabase-js";

export type SupabaseInstance = SupabaseClient<any, "public", any>;

export interface Project {
    id: string;
    created_at: string;
    name: string;
    source_image_url: string;
    rendered_image_url?: string;
    user_id: string;
    user_name?: string;
    renders?: Render[];
    // Computed fields
    display_image_url?: string;
    is_upscaled?: boolean;
}

export interface Render {
    id: string;
    created_at: string;
    project_id: string;
    rendered_image_url: string;
    upscaled_image_url?: string;
    status: "pending" | "processing" | "succeeded" | "failed";
    style_id?: string;
    // Hybrid Storage fields
    cloudinary_public_id?: string;
    upscaled_cloudinary_public_id?: string;
    backup_url?: string;
    upscaled_backup_url?: string;
    drive_file_id?: string;
    upscaled_drive_file_id?: string;
    last_viewed_at?: string;
}

export interface ShowcaseItem {
    id: string;
    created_at: string;
    render_id: string;
    user_id: string;
    is_admin_approved: boolean;
    is_user_public: boolean;
    vote_count: number;
    view_count: number;
    render?: Render;
}

export interface ServiceResponse<T> {
    data: T | null;
    error: any;
}
