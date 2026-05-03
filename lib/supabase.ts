import {createBrowserClient} from '@supabase/ssr'
import {SupabaseClient} from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let client: SupabaseClient | undefined

export const supabase = (() => {
    if (typeof window === 'undefined') return createBrowserClient(supabaseUrl, supabaseAnonKey)
    if (!client) {
        client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    }
    return client
})()
