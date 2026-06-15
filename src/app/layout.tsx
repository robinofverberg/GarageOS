import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/garage", label: "Garage" },
];

export const metadata: Metadata = {
  title: "GarageOS",
  description: "The Operating System for Automotive Ownership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 py-6">
            <Link href="/" className="text-xl font-bold tracking-tight text-white">
              GarageOS
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <main className="flex-1 py-10">{children}</main>

          <footer className="border-t border-slate-800 py-6 text-sm text-slate-400">
            GarageOS v0.4 &mdash; Vehicle CRUD
          </footer>
        </div>
      </body>
    </html>
  );
}
