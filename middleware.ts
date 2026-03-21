import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: ensures ?preview=true persists on all page navigations
 * for authenticated admin users. This way internal <Link> clicks
 * don't lose preview mode.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip API routes, static files, and the admin login page itself
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/admin"
  ) {
    return NextResponse.next();
  }

  const hasAdminSession = request.cookies.has("cpl_admin_session");
  const hasPreview = searchParams.get("preview") === "true";

  // If admin is browsing without ?preview=true, add it
  if (hasAdminSession && !hasPreview) {
    const url = request.nextUrl.clone();
    url.searchParams.set("preview", "true");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
