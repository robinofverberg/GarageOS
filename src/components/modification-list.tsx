"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  createModification,
  deleteModification,
  updateModification,
} from "@/app/garage/actions";
import { SubmitButton } from "@/components/submit-button";
import type { ModificationDetail } from "@/lib/garage-data";
import { displayMileage } from "@/lib/units";

type ModificationListProps = {
  vehicleId: string;
  modifications: ModificationDetail[];
  isMetric: boolean;
  initiallyAdding: boolean;
};

const categorySuggestions = [
  "Aero",
  "Audio",
  "Brakes",
  "Chassis",
  "Drivetrain",
  "Electronics",
  "Engine",
  "Exhaust",
  "Exterior",
  "Forced Induction",
  "Fueling",
  "Interior",
  "Lighting",
  "Suspension",
  "Wheels & Tires",
];

export function ModificationList({
  vehicleId,
  modifications,
  isMetric,
  initiallyAdding,
}: ModificationListProps) {
  const todayValue = toDateInputValue(new Date());
  const totalCost = modifications.reduce((sum, modification) => sum + (modification.cost ?? 0), 0);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Modifications ({modifications.length})
          </h2>
          {modifications.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Documented build spend: {formatCost(totalCost)}
            </p>
          )}
        </div>
        {!initiallyAdding && (
          <a
            href={`/vehicle/${vehicleId}?addModification=1#add-modification-form`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            Add Modification
          </a>
        )}
      </div>

      {initiallyAdding && (
        <form
          id="add-modification-form"
          action={createModification.bind(null, vehicleId)}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <h3 className="text-sm font-semibold text-white">Add Modification</h3>
          <ModificationFields maxDate={todayValue} isMetric={isMetric} />
          <div className="mt-4 flex flex-wrap gap-3">
            <SubmitButton label="Add Modification" pendingLabel="Adding..." />
            <a
              href={`/vehicle/${vehicleId}`}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              Cancel
            </a>
          </div>
        </form>
      )}

      {modifications.length === 0 ? (
        <p className="text-sm text-slate-500">No modifications recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {modifications.map((modification) => (
            <ModificationCard
              key={modification.id}
              modification={modification}
              maxDate={todayValue}
              isMetric={isMetric}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ModificationCard({
  modification,
  maxDate,
  isMetric,
}: {
  modification: ModificationDetail;
  maxDate: string;
  isMetric: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const mileageLabel = isMetric ? "km" : "mi";

  async function saveModification(formData: FormData) {
    await updateModification(modification.id, formData);
    setEditing(false);
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      {editing ? (
        <form action={saveModification} className="space-y-4">
          <ModificationFields modification={modification} maxDate={maxDate} isMetric={isMetric} />
          <div className="flex flex-wrap gap-3">
            <SubmitButton label="Save Modification" pendingLabel="Saving..." />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{modification.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {modification.category}
                {modification.manufacturer ? ` - ${modification.manufacturer}` : ""}
                {modification.productName ? ` - ${modification.productName}` : ""}
              </p>
            </div>
            <p className="text-sm text-slate-400">{formatDate(modification.installedAt)}</p>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Installed at {formatNumber(displayMileage(modification.mileage, isMetric))} {mileageLabel}
          </p>
          {modification.cost !== null && (
            <p className="mt-3 text-sm text-slate-400">Cost: {formatCost(modification.cost)}</p>
          )}
          {modification.notes && (
            <p className="mt-3 text-sm text-slate-400">{modification.notes}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() =>
                startDeleting(async () => {
                  if (!window.confirm(`Delete "${modification.name}" from the build list?`)) {
                    return;
                  }

                  await deleteModification(modification.id);
                })
              }
              disabled={isDeleting}
              className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-700 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function ModificationFields({
  modification,
  maxDate,
  isMetric,
}: {
  modification?: ModificationDetail;
  maxDate: string;
  isMetric: boolean;
}) {
  const mileageLabel = isMetric ? "km" : "mi";

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field label="Build Entry *" htmlFor={fieldId("name", modification)}>
        <input
          id={fieldId("name", modification)}
          name="name"
          type="text"
          required
          placeholder="e.g. Coilover suspension"
          defaultValue={modification?.name ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Modification Category *" htmlFor={fieldId("category", modification)}>
        <input
          id={fieldId("category", modification)}
          name="category"
          type="text"
          required
          list="modification-categories"
          placeholder="e.g. Suspension"
          defaultValue={modification?.category ?? ""}
          className={inputClass}
        />
        <datalist id="modification-categories">
          {categorySuggestions.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </Field>

      <Field label="Manufacturer" htmlFor={fieldId("manufacturer", modification)}>
        <input
          id={fieldId("manufacturer", modification)}
          name="manufacturer"
          type="text"
          placeholder="e.g. Bilstein"
          defaultValue={modification?.manufacturer ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Product Name" htmlFor={fieldId("productName", modification)}>
        <input
          id={fieldId("productName", modification)}
          name="productName"
          type="text"
          placeholder="e.g. B16 PSS10"
          defaultValue={modification?.productName ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Installed *" htmlFor={fieldId("installedAt", modification)}>
        <input
          id={fieldId("installedAt", modification)}
          name="installedAt"
          type="date"
          required
          max={maxDate}
          defaultValue={
            modification ? toDateInputValue(new Date(modification.installedAt)) : maxDate
          }
          className={inputClass}
        />
      </Field>

      <Field label={`Install Mileage (${mileageLabel}) *`} htmlFor={fieldId("mileage", modification)}>
        <input
          id={fieldId("mileage", modification)}
          name="mileage"
          type="number"
          min="0"
          required
          defaultValue={modification ? displayMileage(modification.mileage, isMetric) : ""}
          className={inputClass}
        />
      </Field>

      <Field label="Modification Cost" htmlFor={fieldId("cost", modification)}>
        <input
          id={fieldId("cost", modification)}
          name="cost"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 1299.99"
          defaultValue={modification?.cost ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Notes" htmlFor={fieldId("notes", modification)}>
          <textarea
            id={fieldId("notes", modification)}
            name="notes"
            rows={3}
            defaultValue={modification?.notes ?? ""}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>
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
  children: ReactNode;
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

function fieldId(field: string, modification?: ModificationDetail) {
  return modification ? `${field}-${modification.id}` : `new-modification-${field}`;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
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

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
