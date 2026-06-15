import { type NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";

const COOKIE_NAME = "garageos_session";
const LOGIN_PATH = "/auth/login";

const PROTECTED_PREFIXES = ["/dashboard", "/garage", "/vehicle", "/profile"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET is not configured");
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifyJwt(token, secret);
  if (!user) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/garage/:path*",
    "/vehicle/:path*",
    "/profile/:path*",
  ],
};
