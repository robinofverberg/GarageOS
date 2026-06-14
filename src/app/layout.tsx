import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const navigation = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/garage", label: "Garage" },
  { href: "/vehicle", label: "Vehicle" },
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
            Version 0.1 bootstrap
          </footer>
        </div>
      </body>
    </html>
  );
}
