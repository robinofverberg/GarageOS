"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  updateMaintenanceRecord,
} from "@/app/garage/actions";
import { SubmitButton } from "@/components/submit-button";
import type { MaintenanceRecordDetail } from "@/lib/garage-data";
import { displayMileage } from "@/lib/units";
import type { MaintenanceCategory } from "@prisma/client";

type MaintenanceHistoryProps = {
  vehicleId: string;
  records: MaintenanceRecordDetail[];
  isMetric: boolean;
};

const categoryOptions: { value: MaintenanceCategory; label: string }[] = [
  { value: "Service", label: "Service" },
  { value: "Inspection", label: "Inspection" },
  { value: "Repair", label: "Repair" },
  { value: "Modification", label: "Modification" },
  { value: "Tires", label: "Tires" },
  { value: "Fluids", label: "Fluids" },
  { value: "Other", label: "Other" },
];

const categoryStyles: Record<MaintenanceCategory, { dot: string; text: string }> = {
  Service: { dot: "bg-emerald-400", text: "text-emerald-300" },
  Inspection: { dot: "bg-sky-400", text: "text-sky-300" },
  Repair: { dot: "bg-rose-400", text: "text-rose-300" },
  Modification: { dot: "bg-violet-400", text: "text-violet-300" },
  Tires: { dot: "bg-amber-400", text: "text-amber-300" },
  Fluids: { dot: "bg-cyan-400", text: "text-cyan-300" },
  Other: { dot: "bg-slate-300", text: "text-slate-300" },
};

export function MaintenanceHistory({
  vehicleId,
  records,
  isMetric,
}: MaintenanceHistoryProps) {
  const mileageLabel = isMetric ? "km" : "mi";
  const today = new Date();
  const todayValue = toDateInputValue(today);
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? null);
  const selectedRecord = records.find((record) => record.id === selectedId) ?? records[0] ?? null;
  const timelineRecords = useMemo(
    () =>
      [...records].sort(
        (first, second) => new Date(first.date).getTime() - new Date(second.date).getTime()
      ),
    [records]
  );

  const firstEventDate = timelineRecords[0] ? new Date(timelineRecords[0].date) : today;
  const startDate = startOfDay(firstEventDate);
  const endDate = startOfDay(today);
  const totalTime = Math.max(1, endDate.getTime() - startDate.getTime());
  const maxMileage = Math.max(0, ...records.map((record) => record.mileage));
  const chartMaxMileage = maxMileage + 10000;
  const chartPoints = timelineRecords.map((record) => ({
    record,
    ...getChartPosition(record, startDate, totalTime, chartMaxMileage),
  }));
  const xAxisTicks = getXAxisTicks(startDate, endDate, totalTime);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Maintenance Timeline ({records.length})
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {records.length === 0
              ? "Add the first service, inspection, repair, or modification event."
              : `${formatDate(startDate.toISOString())} to today`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {categoryOptions.map((category) => (
            <span key={category.value} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${categoryStyles[category.value].dot}`} />
              {category.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        {records.length === 0 ? (
          <div className="flex h-64 items-center justify-center border border-dashed border-slate-700 text-sm text-slate-500">
            No timeline events yet.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="relative h-80 border-l border-b border-slate-700 pl-8 pr-4 pt-4">
              <div className="absolute left-2 top-3 text-xs text-slate-500">
                {displayMileage(chartMaxMileage, isMetric).toLocaleString()} {mileageLabel}
              </div>
              <div className="absolute bottom-12 left-2 text-xs text-slate-500">
                0 {mileageLabel}
              </div>
              <svg
                aria-hidden="true"
                className="absolute left-8 right-8 top-7 bottom-12 h-[calc(100%-5.75rem)] w-[calc(100%-4rem)] overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#1e293b" strokeWidth="1" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="1" />
                <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#1e293b" strokeWidth="1" />
                {xAxisTicks.map((tick) => (
                  <line
                    key={`${tick.label}-${tick.x}`}
                    x1={tick.x}
                    y1="0"
                    x2={tick.x}
                    y2="100"
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />
                ))}
                {chartPoints.length > 1 && (
                  <polyline
                    points={chartPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#94a3b8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
              <div className="absolute left-8 right-8 top-7 bottom-12">
                {chartPoints.map(({ record, x, y }) => {
                  const style = categoryStyles[record.category];

                  return (
                    <button
                      key={record.id}
                      type="button"
                      title={`${record.title}: ${displayMileage(record.mileage, isMetric).toLocaleString()} ${mileageLabel}`}
                      onClick={() => setSelectedId(record.id)}
                      onMouseEnter={() => setSelectedId(record.id)}
                      onFocus={() => setSelectedId(record.id)}
                      className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 ${style.dot} outline-none ring-offset-2 ring-offset-slate-900 transition hover:scale-125 focus:ring-2 focus:ring-white ${
                        selectedRecord?.id === record.id ? "scale-125 ring-2 ring-white" : ""
                      }`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <span className="sr-only">{record.title}</span>
                    </button>
                  );
                })}
              </div>
              <div className="absolute bottom-2 left-8 right-8 h-8">
                {xAxisTicks.map((tick, index) => (
                  <span
                    key={`${tick.label}-${tick.x}`}
                    className={`absolute top-0 max-w-20 text-xs text-slate-500 ${
                      index === 0
                        ? "translate-x-0 text-left"
                        : index === xAxisTicks.length - 1
                          ? "-translate-x-full text-right"
                          : "-translate-x-1/2 text-center"
                    }`}
                    style={{ left: `${tick.x}%` }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </div>

            {selectedRecord && (
              <div className="border-t border-slate-800 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <p className={`text-xs font-semibold uppercase tracking-widest ${categoryStyles[selectedRecord.category].text}`}>
                  {selectedRecord.category}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{selectedRecord.title}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {formatDate(selectedRecord.date)} at{" "}
                  {displayMileage(selectedRecord.mileage, isMetric).toLocaleString()} {mileageLabel}
                </p>
                {selectedRecord.cost !== null && (
                  <p className="mt-1 text-sm text-slate-400">
                    Cost: {formatCost(selectedRecord.cost)}
                  </p>
                )}
                {selectedRecord.notes && (
                  <p className="mt-4 text-sm text-slate-300">{selectedRecord.notes}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <form
        action={createMaintenanceRecord.bind(null, vehicleId)}
        className="rounded-xl border border-slate-800 bg-slate-900 p-5"
      >
        <h3 className="text-sm font-semibold text-white">Add Event</h3>
        <MaintenanceFields isMetric={isMetric} maxDate={todayValue} />
        <div className="mt-4">
          <SubmitButton label="Add Event" pendingLabel="Adding..." />
        </div>
      </form>

      {records.length > 0 && (
        <div className="space-y-3">
          {records.map((record) => (
            <MaintenanceRecordCard
              key={record.id}
              record={record}
              isMetric={isMetric}
              maxDate={todayValue}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MaintenanceRecordCard({
  record,
  isMetric,
  maxDate,
}: {
  record: MaintenanceRecordDetail;
  isMetric: boolean;
  maxDate: string;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const mileageLabel = isMetric ? "km" : "mi";

  async function saveRecord(formData: FormData) {
    await updateMaintenanceRecord(record.id, formData);
    setEditing(false);
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      {editing ? (
        <form action={saveRecord} className="space-y-4">
          <MaintenanceFields record={record} isMetric={isMetric} maxDate={maxDate} />
          <div className="flex flex-wrap gap-3">
            <SubmitButton label="Save Event" pendingLabel="Saving..." />
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
              <p className="font-medium text-white">{record.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {record.category} - {displayMileage(record.mileage, isMetric).toLocaleString()}{" "}
                {mileageLabel}
                {record.cost !== null ? ` - ${formatCost(record.cost)}` : ""}
              </p>
            </div>
            <p className="text-sm text-slate-400">{formatDate(record.date)}</p>
          </div>
          {record.notes && <p className="mt-3 text-sm text-slate-400">{record.notes}</p>}
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
                  if (!window.confirm(`Delete "${record.title}" from maintenance history?`)) {
                    return;
                  }
                  await deleteMaintenanceRecord(record.id);
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

function MaintenanceFields({
  record,
  isMetric,
  maxDate,
}: {
  record?: MaintenanceRecordDetail;
  isMetric: boolean;
  maxDate: string;
}) {
  const mileageLabel = isMetric ? "km" : "mi";

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field label="What happened *" htmlFor={fieldId("title", record)}>
        <input
          id={fieldId("title", record)}
          name="title"
          type="text"
          required
          placeholder="e.g. Oil service"
          defaultValue={record?.title ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Category *" htmlFor={fieldId("category", record)}>
        <select
          id={fieldId("category", record)}
          name="category"
          required
          defaultValue={record?.category ?? "Service"}
          className={selectClass}
        >
          {categoryOptions.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Date *" htmlFor={fieldId("performedAt", record)}>
        <input
          id={fieldId("performedAt", record)}
          name="performedAt"
          type="date"
          required
          max={maxDate}
          defaultValue={record ? toDateInputValue(new Date(record.date)) : maxDate}
          className={inputClass}
        />
      </Field>

      <Field label={`Mileage (${mileageLabel}) *`} htmlFor={fieldId("mileage", record)}>
        <input
          id={fieldId("mileage", record)}
          name="mileage"
          type="number"
          min="0"
          required
          defaultValue={record ? displayMileage(record.mileage, isMetric) : ""}
          className={inputClass}
        />
      </Field>

      <Field label="Service Cost" htmlFor={fieldId("cost", record)}>
        <input
          id={fieldId("cost", record)}
          name="cost"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 129.99"
          defaultValue={record?.cost ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Notes" htmlFor={fieldId("notes", record)}>
          <textarea
            id={fieldId("notes", record)}
            name="notes"
            rows={3}
            defaultValue={record?.notes ?? ""}
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

function fieldId(field: string, record?: MaintenanceRecordDetail) {
  return record ? `${field}-${record.id}` : `new-${field}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getChartPosition(
  record: MaintenanceRecordDetail,
  startDate: Date,
  totalTime: number,
  chartMaxMileage: number
) {
  const x =
    ((startOfDay(new Date(record.date)).getTime() - startDate.getTime()) / totalTime) * 100;
  const y = 100 - (record.mileage / chartMaxMileage) * 100;

  return {
    x: clampPercentage(x),
    y: clampPercentage(y),
  };
}

function getXAxisTicks(startDate: Date, endDate: Date, totalTime: number) {
  const ticks: { date: Date; label: string }[] = [
    { date: startDate, label: formatShortDate(startDate) },
  ];
  const yearSpan = endDate.getFullYear() - startDate.getFullYear();

  if (yearSpan <= 8) {
    for (let year = startDate.getFullYear() + 1; year < endDate.getFullYear(); year += 1) {
      ticks.push({ date: new Date(year, 0, 1), label: String(year) });
    }
  } else {
    for (let index = 1; index <= 5; index += 1) {
      const time =
        startDate.getTime() + ((endDate.getTime() - startDate.getTime()) * index) / 6;
      const date = startOfDay(new Date(time));
      ticks.push({ date, label: String(date.getFullYear()) });
    }
  }

  ticks.push({ date: endDate, label: "Today" });

  return dedupeTicks(ticks).map((tick) => ({
    label: tick.label,
    x: clampPercentage(((tick.date.getTime() - startDate.getTime()) / totalTime) * 100),
  }));
}

function dedupeTicks(ticks: { date: Date; label: string }[]) {
  const seen = new Set<string>();
  return ticks.filter((tick) => {
    const key = toDateInputValue(tick.date);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
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

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
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

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

const selectClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
