import { unsealData } from "iron-session";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { SessionData } from "~/lib/session";

const LOGIN_PATH = "/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookieValue = request.cookies.get("triptales-session")?.value;

  if (!cookieValue) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let session: Partial<SessionData>;
  try {
    session = await unsealData<SessionData>(cookieValue, {
      password: process.env.SESSION_SECRET!,
    });
  } catch {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!session.email) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (pathname.startsWith("/admin")) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    if (!adminEmails.includes(session.email.toLowerCase())) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)",
  ],
};
