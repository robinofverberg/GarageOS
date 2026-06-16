"use server";

import { redirect } from "next/navigation";
import { supabase, newId, now } from "@/lib/supabase";
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

  const { data: existing } = await supabase
    .from("User")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const { data: user, error } = await supabase
    .from("User")
    .insert({
      id: newId(),
      email: emailLower,
      passwordHash,
      name: typeof name === "string" ? name.trim() || null : null,
      updatedAt: now(),
    })
    .select("id, email, name")
    .single();

  if (error || !user) {
    return { error: "Could not create account. Please try again." };
  }

  await createSession({
    sub: user.id as string,
    email: user.email as string,
    name: user.name as string | null,
  });

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

  const { data: user } = await supabase
    .from("User")
    .select("id, email, name, passwordHash")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!user || !(await verifyPassword(password, user.passwordHash as string))) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    sub: user.id as string,
    email: user.email as string,
    name: user.name as string | null,
  });

  redirect("/garage");
}

export async function logoutUser() {
  await deleteSession();
  redirect("/auth/login");
}
