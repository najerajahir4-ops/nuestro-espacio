import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const path = request.nextUrl.pathname;

  const isPublicPath = path === '/login' || path.startsWith('/api/auth');

  if (!isPublicPath) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await jwtVerify(session, key, { algorithms: ['HS256'] });
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (isPublicPath && path === '/login' && session) {
    try {
      await jwtVerify(session, key, { algorithms: ['HS256'] });
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      // invalid session, allow going to login
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|images).*)'],
};
