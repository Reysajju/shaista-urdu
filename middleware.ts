import { updateSession } from '@/utils/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Allow public access to root page (guest mode) and auth pages
    if (
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/api') // Allow API access for guest chat
    ) {
        return await updateSession(request)
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
