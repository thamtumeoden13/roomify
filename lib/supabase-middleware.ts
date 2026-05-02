import {createServerClient, type CookieOptions} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (user) {
        // Ensure profile exists (Lazy creation for existing users)
        const {data: profile, error: profileError} = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (!profile && !profileError) {
            // Profile missing, auto-insert it
            const {data: newProfile, error: insertError} = await supabase
                .from('profiles')
                .insert({id: user.id, role: 'user'})
                .select()
                .single()

            // Protected /admin routes check after potential insert
            if (request.nextUrl.pathname.startsWith('/admin')) {
                if (newProfile?.role !== 'admin') {
                    return NextResponse.redirect(new URL('/', request.url))
                }
            }
        } else {
            // Protected /admin routes
            if (request.nextUrl.pathname.startsWith('/admin')) {
                if (profile?.role !== 'admin') {
                    return NextResponse.redirect(new URL('/', request.url))
                }
            }
        }
    } else if (request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}
