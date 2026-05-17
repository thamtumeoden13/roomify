export default function supabaseLoader({src, width, quality}: { src: string, width: number, quality?: number }) {
    // If it's not a Supabase URL, return as is (Next.js will handle or fail based on config)
    if (!src.includes('supabase.co')) {
        return src;
    }

    // Supabase Image Transformation API:
    // https://supabase.com/docs/guides/storage/serving/image-transformations
    // Format: {project_url}/storage/v1/render/image/public/{bucket}/{path}?width={width}&quality={quality}

    // Try to transform the URL to use Supabase's image optimization
    try {
        const url = new URL(src);
        if (url.pathname.includes('/storage/v1/object/public/')) {
            const newPathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
            return `${url.origin}${newPathname}?width=${width}&quality=${quality || 75}`;
        }
    } catch (e) {
        console.error("Error parsing Supabase URL in loader:", e);
    }

    return src;
}
