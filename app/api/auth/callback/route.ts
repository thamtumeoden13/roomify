import {createClient} from '@/lib/supabase-server'
import {NextResponse} from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    console.log('Auth callback hit:', requestUrl.toString())
    const {searchParams, origin} = requestUrl
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')
    const next = searchParams.get('next') ?? '/'

    if (error) {
        console.error('Auth callback error:', error, error_description)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`)
    }

    if (!code) {
        console.log('No code found in searchParams');
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No code provided. Please ensure PKCE is enabled in your Supabase settings.')}`)
    }

    console.log('Code found, exchanging for session...');
    const supabase = await createClient()
    try {
        const {data, error} = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            console.log('Exchange successful, user:', data.user?.email);
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error('Auth error during exchange:', error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    } catch (err: any) {
        console.error('Unexpected auth error:', err)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(err.message || 'Internal Server Error')}`)
    }
}
