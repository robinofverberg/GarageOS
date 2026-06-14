import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicleById, vehicles } from "@/lib/mock-data";

export function generateStaticParams() {
  return vehicles.map((v) => ({ id: v.id }));
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/garage" className="text-sm text-slate-400 hover:text-white">
            ← Garage
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </h1>
          <p className="mt-1 text-slate-400">
            {vehicle.color} &middot; {vehicle.mileage.toLocaleString()} mi &middot; Purchased{" "}
            {new Date(vehicle.purchasedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link
          href={`/vehicle/${vehicle.id}/edit`}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          Edit Vehicle
        </Link>
      </div>

      {vehicle.notes && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-300">{vehicle.notes}</p>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Modifications ({vehicle.modifications.length})
          </h2>
        </div>
        {vehicle.modifications.length === 0 ? (
          <p className="text-sm text-slate-500">No modifications recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {vehicle.modifications.map((mod) => (
              <div
                key={mod.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{mod.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{mod.category}</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(mod.installedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                {mod.notes && (
                  <p className="mt-3 text-sm text-slate-400">{mod.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Maintenance History ({vehicle.maintenanceHistory.length})
          </h2>
        </div>
        {vehicle.maintenanceHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No maintenance records yet.</p>
        ) : (
          <div className="space-y-3">
            {vehicle.maintenanceHistory
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{record.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {record.mileage.toLocaleString()} mi
                      </p>
                    </div>
                    <p className="text-sm text-slate-400">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {record.notes && (
                    <p className="mt-3 text-sm text-slate-400">{record.notes}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
