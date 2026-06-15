import Link from "next/link";
import { createVehicle } from "@/app/garage/actions";
import { SubmitButton } from "@/components/submit-button";
import { getGarageUnitSystem } from "@/lib/garage-data";

const currentYear = new Date().getFullYear();

const bodyTypeOptions = [
  { value: "Sedan", label: "Sedan" },
  { value: "Wagon", label: "Wagon / Estate" },
  { value: "Coupe", label: "Coupe" },
  { value: "Cabriolet", label: "Cabriolet / Convertible" },
  { value: "Hatchback", label: "Hatchback" },
  { value: "SUV", label: "SUV" },
  { value: "Van", label: "Van" },
  { value: "Pickup", label: "Pickup" },
  { value: "Motorcycle", label: "Motorcycle" },
  { value: "Other", label: "Other" },
];

export default async function NewVehiclePage() {
  const unitSystem = await getGarageUnitSystem();
  const isMetric = unitSystem === "Metric";
  const mileageLabel = isMetric ? "km" : "mi";
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/garage" className="text-sm text-slate-400 hover:text-white">
          ← Garage
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Add Vehicle</h1>
      </div>

      <form action={createVehicle} className="max-w-2xl space-y-8">
        <section className="space-y-4">
          <SectionHeading>Identity</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nickname" htmlFor="nickname">
              <input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="e.g. The Beast"
                className={inputClass}
              />
            </Field>

            <Field label="Registration Number" htmlFor="registrationNumber">
              <input
                id="registrationNumber"
                name="registrationNumber"
                type="text"
                placeholder="e.g. ABC123"
                maxLength={20}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Specification</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Year *" htmlFor="year">
              <input
                id="year"
                name="year"
                type="number"
                min="1886"
                max={currentYear + 1}
                defaultValue={currentYear}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Make *" htmlFor="make">
              <input
                id="make"
                name="make"
                type="text"
                placeholder="e.g. Toyota"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Model *" htmlFor="model">
              <input
                id="model"
                name="model"
                type="text"
                placeholder="e.g. Supra"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Trim" htmlFor="trim">
              <input
                id="trim"
                name="trim"
                type="text"
                placeholder="e.g. Turbo"
                className={inputClass}
              />
            </Field>

            <Field label="Body Type" htmlFor="bodyType">
              <select id="bodyType" name="bodyType" className={selectClass}>
                <option value="">— Select —</option>
                {bodyTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Color" htmlFor="color">
              <input
                id="color"
                name="color"
                type="text"
                placeholder="e.g. Super White"
                className={inputClass}
              />
            </Field>

            <Field label="Engine" htmlFor="engine">
              <input
                id="engine"
                name="engine"
                type="text"
                placeholder="e.g. 2JZ-GTE"
                className={inputClass}
              />
            </Field>

            <Field label="Transmission" htmlFor="transmission">
              <input
                id="transmission"
                name="transmission"
                type="text"
                placeholder="e.g. 6-speed manual"
                className={inputClass}
              />
            </Field>

            <Field label="Fuel Type" htmlFor="fuelType">
              <input
                id="fuelType"
                name="fuelType"
                type="text"
                placeholder="e.g. Petrol"
                className={inputClass}
              />
            </Field>

            <Field label="Horsepower (hp)" htmlFor="horsepower">
              <input
                id="horsepower"
                name="horsepower"
                type="number"
                min="0"
                placeholder="e.g. 320"
                className={inputClass}
              />
            </Field>

            <Field label="Torque (Nm)" htmlFor="torque">
              <input
                id="torque"
                name="torque"
                type="number"
                min="0"
                placeholder="e.g. 440"
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading>Ownership</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Mileage (${mileageLabel})`} htmlFor="mileage">
              <input
                id="mileage"
                name="mileage"
                type="number"
                min="0"
                placeholder="e.g. 45000"
                className={inputClass}
              />
            </Field>

            <Field label="Purchase Date" htmlFor="purchasedAt">
              <input
                id="purchasedAt"
                name="purchasedAt"
                type="date"
                className={inputClass}
              />
            </Field>

            <Field label="Purchase Price" htmlFor="purchasePrice">
              <input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 25000"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Any additional notes about this vehicle..."
              className={`${inputClass} resize-none`}
            />
          </Field>
        </section>

        <div className="flex gap-3">
          <SubmitButton label="Add Vehicle" pendingLabel="Adding…" />
          <Link
            href="/garage"
            className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </h2>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

const selectClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
