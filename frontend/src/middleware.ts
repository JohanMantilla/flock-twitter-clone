import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];
const PROTECTED_PREFIX = ['/home', '/profile', '/search'];

export function middleware(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value;
    const { pathname } = req.nextUrl;

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isProtected = PROTECTED_PREFIX.some(p => pathname.startsWith(p));

    if (!token && isProtected) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (token && isPublic) {
        return NextResponse.redirect(new URL('/home', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};