import Link from "next/link";
import Image from "next/image";
import { getGarageOverview } from "@/lib/garage-data";
import { displayMileage } from "@/lib/units";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function GaragePage() {
  const user = await requireUser();
  const { vehicles, unitSystem } = await getGarageOverview(user.sub);
  const isMetric = unitSystem === "Metric";
  const mileageLabel = isMetric ? "km" : "mi";

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Garage</h1>
        <Link
          href="/garage/new"
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
        >
          + Add Vehicle
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Vehicles
        </h2>
        {vehicles.length === 0 ? (
          <p className="text-sm text-slate-500">No vehicles in the garage yet.</p>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                href={`/vehicle/${vehicle.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700 hover:bg-slate-800"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-950">
                    {vehicle.featuredPhoto ? (
                      <Image
                        src={vehicle.featuredPhoto.url}
                        alt={vehicle.featuredPhoto.caption ?? `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-600">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {vehicle.nickname ? (
                        <>
                          {vehicle.nickname}
                          <span className="ml-2 text-sm font-normal text-slate-400">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                            {vehicle.trim ? ` ${vehicle.trim}` : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                          {vehicle.trim ? ` ${vehicle.trim}` : ""}
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {vehicle.color ? `${vehicle.color} - ` : ""}
                      {displayMileage(vehicle.mileage, isMetric).toLocaleString()} {mileageLabel}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-400">
                  <p>
                    {vehicle.modificationCount} mod
                    {vehicle.modificationCount !== 1 ? "s" : ""}
                  </p>
                  <p>
                    {vehicle.maintenanceRecordCount} service
                    {vehicle.maintenanceRecordCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
