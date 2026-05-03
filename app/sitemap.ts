import type {MetadataRoute} from "next";
import {createClient} from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://roomify-iota-two.vercel.app";

    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/gallery`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
    ];

    // Dynamic routes from Supabase
    const supabase = await createClient();

    // Fetch only publicly shared or admin approved projects
    const {data: showcaseItems} = await supabase
        .from("showcase")
        .select("id, created_at")
        .or("is_user_public.eq.true,is_admin_approved.eq.true");

    const dynamicRoutes: MetadataRoute.Sitemap = (showcaseItems || []).map((item) => ({
        url: `${baseUrl}/share/${item.id}`,
        lastModified: new Date(item.created_at),
        changeFrequency: "daily",
        priority: 0.7,
    }));

    return [...staticRoutes, ...dynamicRoutes];
}
