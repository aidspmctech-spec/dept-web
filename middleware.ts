import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Keep one response object so refreshed cookies are not discarded.
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[MIDDLEWARE] Missing Supabase public environment variables');
    return new NextResponse('Authentication service is not configured.', { status: 500 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        headers?: Record<string, string>,
      ) {
        // Make refreshed cookies available to Server Components in this request.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Rebuild the response with the updated request, then persist every cookie.
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        // Supabase supplies cache-prevention headers when auth cookies change.
        if (headers) {
          Object.entries(headers).forEach(([name, value]) => {
            supabaseResponse.headers.set(name, value);
          });
        }
      },
    },
  });

  // Verify the JWT and refresh it when required. This avoids a user-info
  // network round trip on every middleware invocation.
  const { data: { claims }, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(claims?.sub);

  const pathname = request.nextUrl.pathname;
  const isLoginOrRegister = pathname === '/login' || pathname === '/register';

  const isProtectedRoute = ['/dashboard', '/student', '/staff', '/admin'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('message', 'Please sign in to access this page');

    const redirectResponse = NextResponse.redirect(redirectUrl);
    // A redirect must carry any refreshed/deleted cookies and cache headers too.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    for (const header of ['cache-control', 'expires', 'pragma']) {
      const value = supabaseResponse.headers.get(header);
      if (value) redirectResponse.headers.set(header, value);
    }
    return redirectResponse;
  }

  if (isAuthenticated && isLoginOrRegister) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';

    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    for (const header of ['cache-control', 'expires', 'pragma']) {
      const value = supabaseResponse.headers.get(header);
      if (value) redirectResponse.headers.set(header, value);
    }
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
