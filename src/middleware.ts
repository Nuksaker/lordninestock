import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'session';

// Protected routes
const PROTECTED_PATHS = ['/dashboard', '/members', '/items', '/drops'];
const PROTECTED_API_PATHS = ['/api/players', '/api/items', '/api/bosses', '/api/drops', '/api/shares'];

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.error('ADMIN_SECRET is not set');
    return new TextEncoder().encode('fallback-secret');
  }
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    // Check expiry
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow login page and auth API
  if (pathname === '/login' || pathname === '/api/auth/login') {
    return NextResponse.next();
  }
  
  // Check if path needs protection
  const isProtectedPage = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isProtectedApi = PROTECTED_API_PATHS.some(p => pathname.startsWith(p));
  
  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }
  
  // Get session token
  const token = request.cookies.get(COOKIE_NAME)?.value;
  
  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify token
  const isValid = await verifyToken(token);
  
  if (!isValid) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Clear invalid cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/members/:path*',
    '/items/:path*',
    '/drops/:path*',
    '/api/players/:path*',
    '/api/items/:path*',
    '/api/bosses/:path*',
    '/api/drops/:path*',
    '/api/shares/:path*',
  ],
};
