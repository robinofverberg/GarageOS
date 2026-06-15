import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-white">
        Dashboard
      </h1>
      <p className="text-slate-300">
        Welcome back{user.name ? `, ${user.name}` : ""}.
      </p>
    </section>
  );
}
