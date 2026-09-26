import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/session";

/** Every route that requires a signed-in traveller. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/explore",
  "/trips",
  "/challenges",
  "/impact",
  "/reports",
  "/community",
  "/profile",
  "/plan",
  "/accessibility",
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    url.searchParams.set("next", pathname);
    url.searchParams.set("reason", "session");

    const response = NextResponse.redirect(url);
    // Clear any expired / tampered cookie so the user lands on a clean form.
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/explore/:path*",
    "/trips/:path*",
    "/challenges/:path*",
    "/impact/:path*",
    "/reports/:path*",
    "/community/:path*",
    "/profile/:path*",
    "/plan/:path*",
    "/accessibility/:path*",
  ],
};
