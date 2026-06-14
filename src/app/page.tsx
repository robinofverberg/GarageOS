import Link from "next/link";

const sections = [
  {
    title: "Dashboard",
    description: "Overview of your garage activity and quick insights.",
    href: "/dashboard",
  },
  {
    title: "Garage",
    description: "Manage your digital garage and vehicles in one place.",
    href: "/garage",
  },
  {
    title: "Vehicle",
    description: "Open a vehicle profile and track build history.",
    href: "/vehicle",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">GarageOS</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          The operating system for automotive ownership.
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Start documenting your garage, vehicles, and projects in one central place.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700 hover:bg-slate-800"
          >
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{section.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
