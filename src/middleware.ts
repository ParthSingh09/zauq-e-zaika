import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast edge-level guard: visitors without a session cookie are sent to the
 * login page. Real authorisation (valid session + ADMIN role) is enforced
 * server-side in every admin page, server action and API route.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("zz_session")?.value);
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (pathname === "/account" && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/account/login";
    url.search = "?next=/account";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/account"] };
