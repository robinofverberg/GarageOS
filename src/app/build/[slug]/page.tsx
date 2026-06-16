import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicBuildCard } from "@/lib/garage-data";
import { displayMileage } from "@/lib/units";

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

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicBuildCard(slug);

  if (!result) {
    return {
      title: "Build Not Found | GarageOS",
    };
  }

  const { vehicle } = result;
  const title = `${vehicle.nickname ? `${vehicle.nickname} - ` : ""}${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const description = [
    vehicle.engine,
    vehicle.horsepower ? `${vehicle.horsepower} hp` : null,
    `${vehicle.modifications.length} modifications`,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: `${title} | GarageOS Build Card`,
    description,
    openGraph: {
      title,
      description,
      images: vehicle.featuredPhoto ? [{ url: vehicle.featuredPhoto.url }] : undefined,
    },
  };
}

export default async function PublicBuildPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicBuildCard(slug);

  if (!result) {
    notFound();
  }

  const { vehicle, unitSystem } = result;
  const isMetric = unitSystem === "Metric";
  const mileageLabel = isMetric ? "km" : "mi";
  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;
  const timelineEvents = [
    ...vehicle.modifications.map((modification) => ({
      id: `mod-${modification.id}`,
      title: modification.name,
      type: "Modification",
      date: modification.installedAt,
      mileage: modification.mileage,
    })),
    ...vehicle.maintenanceHistory.map((record) => ({
      id: `maintenance-${record.id}`,
      title: record.title,
      type: record.category,
      date: record.date,
      mileage: record.mileage,
    })),
  ]
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="relative min-h-[28rem]">
          {vehicle.featuredPhoto ? (
            <Image
              src={vehicle.featuredPhoto.url}
              alt={vehicle.featuredPhoto.caption ?? vehicleTitle}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-widest text-slate-300">
              {vehicle.garageName}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {vehicle.nickname ?? vehicleTitle}
            </h1>
            {vehicle.nickname && (
              <p className="mt-2 text-lg text-slate-300">{vehicleTitle}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-md bg-slate-950/75 px-3 py-2">
                {displayMileage(vehicle.mileage, isMetric).toLocaleString()} {mileageLabel}
              </span>
              {vehicle.color && (
                <span className="rounded-md bg-slate-950/75 px-3 py-2">{vehicle.color}</span>
              )}
              <span className="rounded-md bg-slate-950/75 px-3 py-2">
                {vehicle.modifications.length} mods
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Build Total" value={formatCost(vehicle.totalBuildCost)} />
        <SummaryCard label="Purchase Price" value={formatOptionalCost(vehicle.purchasePrice)} />
        <SummaryCard label="Modifications" value={formatCost(vehicle.totalModificationCost)} />
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Specs
        </h2>
        <div className="grid gap-px overflow-hidden rounded-xl border border-slate-800 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Make", value: vehicle.make },
            { label: "Model", value: vehicle.model },
            { label: "Year", value: vehicle.year },
            vehicle.trim ? { label: "Trim", value: vehicle.trim } : null,
            vehicle.bodyType ? { label: "Body Type", value: bodyTypeLabels[vehicle.bodyType] ?? vehicle.bodyType } : null,
            vehicle.engine ? { label: "Engine", value: vehicle.engine } : null,
            vehicle.transmission ? { label: "Transmission", value: vehicle.transmission } : null,
            vehicle.fuelType ? { label: "Fuel Type", value: vehicle.fuelType } : null,
            vehicle.horsepower ? { label: "Horsepower", value: `${vehicle.horsepower} hp` } : null,
            vehicle.torque ? { label: "Torque", value: `${vehicle.torque} Nm` } : null,
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

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Modification List
          </h2>
          {vehicle.modifications.length === 0 ? (
            <p className="text-sm text-slate-500">No modifications shared yet.</p>
          ) : (
            <div className="space-y-3">
              {vehicle.modifications.map((modification) => (
                <article key={modification.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{modification.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[modification.category, modification.manufacturer]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {modification.productName && (
                        <p className="mt-1 text-xs text-slate-400">
                          {modification.productUrl ? (
                            <a
                              href={modification.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-slate-600 underline-offset-2 transition hover:text-white"
                            >
                              {modification.productName}
                            </a>
                          ) : (
                            modification.productName
                          )}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{formatDate(modification.installedAt)}</p>
                  </div>
                  {modification.notes && (
                    <p className="mt-3 text-sm text-slate-400">{modification.notes}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-8">
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Maintenance Highlights
            </h2>
            {vehicle.maintenanceHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No maintenance records shared yet.</p>
            ) : (
              <div className="space-y-3">
                {vehicle.maintenanceHistory.slice(0, 4).map((record) => (
                  <article key={record.id} className="border-l border-slate-700 pl-4">
                    <p className="text-sm font-medium text-white">{record.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.category} · {formatDate(record.date)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Timeline Preview
            </h2>
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No timeline events shared yet.</p>
            ) : (
              <div className="space-y-4">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {event.type}
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(event.date)} ·{" "}
                      {displayMileage(event.mileage, isMetric).toLocaleString()} {mileageLabel}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>

      {vehicle.photos.length > 1 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Gallery
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicle.photos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "Vehicle gallery photo"}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatCost(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatOptionalCost(value: number | null) {
  return value !== null && value > 0 ? formatCost(value) : "Not shared";
}
