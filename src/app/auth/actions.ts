"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";

type AuthState = { error: string | null };

export async function registerUser(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required." };
  }
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const emailLower = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: emailLower,
      passwordHash,
      name: typeof name === "string" ? name.trim() || null : null,
    },
  });

  await createSession({ sub: user.id, email: user.email, name: user.name });

  redirect("/garage");
}

export async function loginUser(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession({ sub: user.id, email: user.email, name: user.name });

  redirect("/garage");
}

export async function logoutUser() {
  await deleteSession();
  redirect("/auth/login");
}
