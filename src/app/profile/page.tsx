import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logoutUser } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const garage = await prisma.garage.findFirst({
    where: { userId: user.sub },
    select: {
      _count: { select: { vehicles: true } },
    },
  });

  const vehicleCount = garage?._count.vehicles ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Profile
        </h1>
        <p className="mt-1 text-slate-400">Your GarageOS account.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Account
        </h2>
        <div className="grid gap-px overflow-hidden rounded-xl border border-slate-800 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Name", value: user.name ?? "—" },
            { label: "Email", value: user.email },
            { label: "Vehicles", value: String(vehicleCount) },
          ].map((item) => (
            <div key={item.label} className="bg-slate-900 px-5 py-4">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Session
        </h2>
        <form action={logoutUser}>
          <SubmitButton
            label="Sign out"
            pendingLabel="Signing out…"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          />
        </form>
      </section>
    </div>
  );
}
