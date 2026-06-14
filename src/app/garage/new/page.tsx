import Link from "next/link";
import { createVehicle } from "@/app/garage/actions";

const currentYear = new Date().getFullYear();

export default function NewVehiclePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/garage" className="text-sm text-slate-400 hover:text-white">
          ← Garage
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Add Vehicle</h1>
      </div>

      <form action={createVehicle} className="max-w-xl space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Year" htmlFor="year">
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

          <Field label="Make" htmlFor="make">
            <input
              id="make"
              name="make"
              type="text"
              placeholder="e.g. Toyota"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Model" htmlFor="model">
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

          <Field label="Color" htmlFor="color">
            <input
              id="color"
              name="color"
              type="text"
              placeholder="e.g. Super White"
              className={inputClass}
            />
          </Field>

          <Field label="Mileage" htmlFor="mileage">
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

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600"
          >
            Add Vehicle
          </button>
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
