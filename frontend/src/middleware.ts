import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("cc_access_token")?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const isProtectedRoute = pathname === "/" || pathname.startsWith("/medicamentos") || pathname === "/onboarding";

  // Auth routes
  const isAuthRoute = pathname === "/login";

  if (isProtectedRoute && !token) {
    // Redirect to login page if no token
    const loginUrl = new URL("/login", request.url);
    // Optional: save destination to redirect back after login
    // loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    // Redirect to home if already logged in
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png, icons/ (public assets)
     */
    "/",
    "/medicamentos/:path*",
    "/login",
    "/onboarding",
  ],
};
