import {NextResponse} from 'next/server';
import {supabase} from "@/lib/supabase";

export async function POST(request: Request): Promise<NextResponse> {
    const {searchParams} = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
        return NextResponse.json({error: 'Filename is required'}, {status: 400});
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({error: 'File is required'}, {status: 400});
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2, 11)}.${fileExt}`;
        const filePath = `inputs/${fileName}`;

        const {data, error} = await supabase.storage
            .from('roomify-assets')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true,
                cacheControl: '3600'
            });

        if (error) {
            console.error("Supabase Storage error:", error);
            return NextResponse.json({error: error.message}, {status: 500});
        }

        const {data: {publicUrl}} = supabase.storage
            .from('roomify-assets')
            .getPublicUrl(filePath);

        return NextResponse.json({url: publicUrl});
    } catch (e: any) {
        console.error("Upload process error:", e);
        return NextResponse.json({error: e.message}, {status: 500});
    }
}
