import "server-only";

import { cookies } from "next/headers";
import { signJwt, verifyJwt, type JwtPayload } from "@/lib/jwt";

export type { JwtPayload as SessionUser };

const COOKIE_NAME = "garageos_session";
const SESSION_DAYS = 30;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is required");
  return secret;
}

export async function createSession(
  user: Pick<JwtPayload, "sub" | "email" | "name">
): Promise<void> {
  const exp =
    Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const token = await signJwt({ ...user, exp }, getSecret());
  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<JwtPayload | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return verifyJwt(token, secret);
}

export async function requireUser(): Promise<JwtPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
