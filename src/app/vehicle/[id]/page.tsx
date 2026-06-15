import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/garage-data";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";
import { MaintenanceHistory } from "@/components/maintenance-history";
import { displayMileage } from "@/lib/units";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyTypeLabels: Record<string, string> = {
 Sedan: "Sedan",
 Wagon: "Wagon / Estate",
 Coupe: "Coupe",
 Cabriolet: "Cabriolet / Convertible",
 Hatchback: "Hatchback",
 SUV: "SUV",
 Van: "Van",
 Pickup: "Pickup",
 Motorcycle: "Motorcycle",
 Other: "Other",
};

export default async function VehicleDetailPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;
 const user = await requireUser();
 const result = await getVehicleById(id, user.sub);

 if (!result) {
   notFound();
 }

 const { vehicle, unitSystem } = result;
 const isMetric = unitSystem === "Metric";
 const mileageLabel = isMetric ? "km" : "mi";

 const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;

 return (
   <div className="space-y-10">
     <div className="flex flex-wrap items-start justify-between gap-4">
       <div>
         <Link href="/garage" className="text-sm text-slate-400 hover:text-white">
           ← Garage
         </Link>
         <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
           {vehicle.nickname ? (
             <>
               {vehicle.nickname}
               <span className="ml-3 text-lg font-normal text-slate-400">
                 {vehicleTitle}
               </span>
             </>
           ) : (
             vehicleTitle
           )}
         </h1>
         <p className="mt-1 text-slate-400">
           {vehicle.color ? `${vehicle.color} · ` : ""}
           {displayMileage(vehicle.mileage, isMetric).toLocaleString()} {mileageLabel}
           {vehicle.registrationNumber ? ` · ${vehicle.registrationNumber}` : ""}
           {vehicle.purchasedAt ? (
             <>
               {" "}
               &middot; Purchased{" "}
               {new Date(vehicle.purchasedAt).toLocaleDateString("en-US", {
                 year: "numeric",
                 month: "long",
                 day: "numeric",
                 timeZone: "UTC",
               })}
             </>
           ) : null}
         </p>
       </div>
       <div className="flex flex-wrap gap-3">
         <Link
           href={`/vehicle/${vehicle.id}/edit`}
           className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
         >
           Edit Vehicle
         </Link>
         <DeleteVehicleButton vehicleId={vehicle.id} vehicleLabel={vehicleTitle} />
       </div>
     </div>

     {vehicle.notes && (
       <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
         <p className="text-sm text-slate-300">{vehicle.notes}</p>
       </section>
     )}

     <section>
       <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
         Specifications
       </h2>
       <div className="grid gap-px overflow-hidden rounded-xl border border-slate-800 sm:grid-cols-2 lg:grid-cols-3">
         {[
           { label: "Make", value: vehicle.make },
           { label: "Model", value: vehicle.model },
           { label: "Year", value: vehicle.year },
           vehicle.trim ? { label: "Trim", value: vehicle.trim } : null,
           vehicle.bodyType ? { label: "Body Type", value: bodyTypeLabels[vehicle.bodyType] ?? vehicle.bodyType } : null,
           vehicle.color ? { label: "Color", value: vehicle.color } : null,
           vehicle.engine ? { label: "Engine", value: vehicle.engine } : null,
           vehicle.transmission ? { label: "Transmission", value: vehicle.transmission } : null,
           vehicle.fuelType ? { label: "Fuel Type", value: vehicle.fuelType } : null,
           vehicle.horsepower ? { label: "Horsepower", value: `${vehicle.horsepower} hp` } : null,
           vehicle.torque ? { label: "Torque", value: `${vehicle.torque} Nm` } : null,
           { label: "Mileage", value: `${displayMileage(vehicle.mileage, isMetric).toLocaleString()} ${mileageLabel}` },
         ]
           .filter(Boolean)
           .map((item) => (
             <div key={item!.label} className="bg-slate-900 px-5 py-4">
               <p className="text-xs text-slate-500">{item!.label}</p>
               <p className="mt-0.5 text-sm font-medium text-white">{item!.value}</p>
             </div>
           ))}
       </div>
     </section>

     {(vehicle.purchasedAt || vehicle.purchasePrice !== null || vehicle.registrationNumber) && (
       <section>
         <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
           Ownership
         </h2>
         <div className="grid gap-px overflow-hidden rounded-xl border border-slate-800 sm:grid-cols-2 lg:grid-cols-3">
           {[
             vehicle.registrationNumber ? { label: "Registration Number", value: vehicle.registrationNumber } : null,
             vehicle.purchasedAt
               ? {
                   label: "Purchase Date",
                   value: new Date(vehicle.purchasedAt).toLocaleDateString("en-US", {
                     year: "numeric",
                     month: "long",
                     day: "numeric",
                     timeZone: "UTC",
                   }),
                 }
               : null,
             vehicle.purchasePrice !== null
               ? { label: "Purchase Price", value: vehicle.purchasePrice.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }) }
               : null,
           ]
             .filter(Boolean)
             .map((item) => (
               <div key={item!.label} className="bg-slate-900 px-5 py-4">
                 <p className="text-xs text-slate-500">{item!.label}</p>
                 <p className="mt-0.5 text-sm font-medium text-white">{item!.value}</p>
               </div>
             ))}
         </div>
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
                     timeZone: "UTC",
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

     <MaintenanceHistory
       vehicleId={vehicle.id}
       records={vehicle.maintenanceHistory}
       isMetric={isMetric}
     />
  </div>
 );
}
