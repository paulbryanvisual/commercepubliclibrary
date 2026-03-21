import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for admin preview mode.
 *
 * URL pattern: append /admin to any page URL to enter admin view.
 *   /events/admin  → serves /events?preview=true (admin chat + drafts visible)
 *   /events        → serves /events (live page, no admin)
 *   /admin         → login page (pass through)
 *
 * Once in preview mode, internal link clicks keep ?preview=true
 * so admin mode persists while browsing.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const hasAdminSession = request.cookies.has("cpl_admin_session");

  // ── Handle /anything/admin suffix ──
  // Exactly "/admin" = login page (pass through)
  // "/something/admin" = preview mode for that page
  if (pathname.endsWith("/admin") && pathname !== "/admin") {
    // Strip the /admin suffix to get the real page path
    const realPath = pathname.replace(/\/admin$/, "") || "/";

    if (!hasAdminSession) {
      // Not logged in — redirect to login page
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin";
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to the real page with ?preview=true
    const url = request.nextUrl.clone();
    url.pathname = realPath;
    url.searchParams.set("preview", "true");
    return NextResponse.redirect(url);
  }

  // ── Keep ?preview=true on internal navigations ──
  // If admin is browsing with preview=true and clicks a link,
  // the new page won't have ?preview=true — re-add it.
  if (hasAdminSession && searchParams.get("preview") === "true") {
    // Already has preview — pass through
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
