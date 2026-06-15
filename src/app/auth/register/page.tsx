"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState = { error: null };

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function RegisterPage() {
  const [state, action] = useActionState(registerUser, initialState);

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Create account
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-slate-200 underline hover:text-white"
          >
            Sign in
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
            htmlFor="name"
            className="block text-sm font-medium text-slate-300"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Robin"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300"
          >
            Email *
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
            Password * <span className="text-slate-500">(min. 8 characters)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </div>

        <SubmitButton
          label="Create account"
          pendingLabel="Creating…"
          className="w-full rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </form>
    </div>
  );
}
