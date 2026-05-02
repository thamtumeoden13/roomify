import {createClient} from '@/lib/supabase-server';
import {NextResponse} from 'next/server';
import {isAdmin} from '@/lib/admin';

export async function POST(request: Request) {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user || !(await isAdmin(user.id))) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {showcaseId, action} = await request.json();

    if (action === 'approve') {
        const {error} = await supabase
            .from('showcase')
            .update({is_admin_approved: true})
            .eq('id', showcaseId);

        if (error) return NextResponse.json({error: error.message}, {status: 500});
        return NextResponse.json({success: true});
    } else if (action === 'reject') {
        const {error} = await supabase
            .from('showcase')
            .delete()
            .eq('id', showcaseId);

        if (error) return NextResponse.json({error: error.message}, {status: 500});
        return NextResponse.json({success: true});
    } else if (action === 'unapprove') {
        const {error} = await supabase
            .from('showcase')
            .update({is_admin_approved: false})
            .eq('id', showcaseId);

        if (error) return NextResponse.json({error: error.message}, {status: 500});
        return NextResponse.json({success: true});
    }

    return NextResponse.json({error: 'Invalid action'}, {status: 400});
}
