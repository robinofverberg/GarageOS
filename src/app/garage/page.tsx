import Link from "next/link";
import { getGarageOverview } from "@/lib/garage-data";
import { updateGarageUnitSystem } from "@/app/garage/actions";
import { displayMileage } from "@/lib/units";

export default async function GaragePage() {
  const { stats, vehicles, unitSystem } = await getGarageOverview();
  const isMetric = unitSystem === "Metric";
  const mileageLabel = isMetric ? "km" : "mi";

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Garage</h1>
        <div className="flex items-center gap-3">
          <form action={updateGarageUnitSystem}>
            <input
              type="hidden"
              name="unitSystem"
              value={isMetric ? "Imperial" : "Metric"}
            />
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-slate-600 hover:text-white"
              title="Switch unit system"
            >
              {isMetric ? "km" : "mi"} ⇄ {isMetric ? "mi" : "km"}
            </button>
          </form>
          <Link
            href="/garage/new"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            + Add Vehicle
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Vehicles", value: stats.totalVehicles },
            { label: "Modifications", value: stats.totalModifications },
            { label: "Maintenance Records", value: stats.totalMaintenanceRecords },
            { label: "Oldest Vehicle", value: stats.oldestVehicleYear ?? "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

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
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-800"
              >
                <div>
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
                    {vehicle.color ? `${vehicle.color} · ` : ""}
                    {displayMileage(vehicle.mileage, isMetric).toLocaleString()} {mileageLabel}
                  </p>
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
