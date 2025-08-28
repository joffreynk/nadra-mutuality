import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/api/openapi.json',
  '/api/health',
  '/api/auth/signup',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js'
];

export async function middleware(req: NextRequest) {

  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p:any) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const userRole = token.role as string;
  
  // Admin routes - only HEALTH_OWNER can access
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'HEALTH_OWNER') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Pharmacy routes - only PHARMACY users can access
  if (pathname.startsWith('/pharmacy')) {
    if (userRole !== 'PHARMACY') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Hospital routes - only HOSPITAL users can access
  if (pathname.startsWith('/hospital')) {
    if (userRole !== 'HOSPITAL') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Worker routes - WORKER and HEALTH_OWNER can access
  if (pathname.startsWith('/members') || pathname.startsWith('/cards') || pathname.startsWith('/billing')) {
    if (userRole !== 'WORKER' && userRole !== 'HEALTH_OWNER') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};


