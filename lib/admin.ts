import {createClient} from './supabase-server';

export async function isAdmin(userId?: string) {
    if (!userId) return false;

    const supabase = await createClient();
    const {data, error} = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error('Error checking admin status:', error);
        return false;
    }

    return data.role === 'admin';
}
