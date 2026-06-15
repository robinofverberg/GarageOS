"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState = { error: null };

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function LoginPage() {
  const [state, action] = useActionState(loginUser, initialState);

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-slate-200 underline hover:text-white"
          >
            Create one
          </Link>
        </p>
      </div>

      <form action={action} className="space-y-4">
        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300"
          >
            {state.error}
          </p>
        )}

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        <SubmitButton
          label="Sign in"
          pendingLabel="Signing in…"
          className="w-full rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </form>
    </div>
  );
}
