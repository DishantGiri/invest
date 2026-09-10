import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'catl_investment_super_secret_key_2026_nxt'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/dashboard and any sub-routes of /admin/ EXCEPT /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('catl_auth_token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'Please login with an Admin account.');
      return NextResponse.redirect(loginUrl);
    }

    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      const payload = verified.payload as { role?: string };

      if (payload.role !== 'admin') {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('error', 'Access denied. Admin privileges required.');
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'Session expired. Please login again.');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/admin/:path*'],
};
