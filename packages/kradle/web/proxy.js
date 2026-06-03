import { NextResponse } from 'next/server.js';

const PUBLIC_PAGE_PATHS = new Set(['/login']);
const PUBLIC_PATH_PREFIXES = ['/api/auth', '/_next'];
const PUBLIC_FILE_PATTERN = /\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|json|woff2?)$/;

function applySecurityHeaders(response) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

function applyCorsHeaders(request, response) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  return response;
}

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // Handle CORS preflight requests for API routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const preflightResponse = new NextResponse(null, { status: 204 });
    applyCorsHeaders(request, preflightResponse);
    return preflightResponse;
  }

  if (isPublicPath(pathname)) {
    return applyCorsHeaders(request, applySecurityHeaders(NextResponse.next()));
  }

  const cookieName = process.env.KRADLE_AUTH_COOKIE_NAME || 'kradle_session';
  if (request.cookies.has(cookieName)) {
    return applyCorsHeaders(request, applySecurityHeaders(NextResponse.next()));
  }

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)']
};

function isPublicPath(pathname) {
  if (PUBLIC_PAGE_PATHS.has(pathname)) return true;
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
  return PUBLIC_FILE_PATTERN.test(pathname);
}