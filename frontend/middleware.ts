import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

/**
 * Protects the dashboard app shell. The JWT remains in localStorage for API calls;
 * a lightweight presence cookie is set on login so this check can run on the Edge runtime.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.get(SESSION_COOKIE_NAME)?.value === "1";
  if (hasSession) {
    return NextResponse.next();
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
