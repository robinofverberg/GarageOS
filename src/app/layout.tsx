import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "GarageOS",
  description: "The Operating System for Automotive Ownership.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 py-6">
            <Link href="/" className="text-xl font-bold tracking-tight text-white">
              GarageOS
            </Link>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              {user ? (
                <>
                  {[
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/garage", label: "Garage" },
                    { href: "/profile", label: "Profile" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-md border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-slate-600 hover:text-white"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </header>

          <main className="flex-1 py-10">{children}</main>

          <footer className="border-t border-slate-800 py-6 text-sm text-slate-400">
            GarageOS v0.7 &mdash; Authentication
          </footer>
        </div>
      </body>
    </html>
  );
}
