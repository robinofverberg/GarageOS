"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  updateMaintenanceRecord,
} from "@/app/garage/actions";
import { SubmitButton } from "@/components/submit-button";
import type { MaintenanceRecordDetail, ModificationDetail } from "@/lib/garage-data";
import { displayMileage } from "@/lib/units";
import type { MaintenanceCategory } from "@prisma/client";

type MaintenanceHistoryProps = {
  vehicleId: string;
  records: MaintenanceRecordDetail[];
  modifications: ModificationDetail[];
  isMetric: boolean;
  initiallyAdding: boolean;
  initialRange?: string;
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

type TimelineRange = "all" | "10y" | "5y" | "2y" | "1y";

const rangeOptions: { value: TimelineRange; label: string }[] = [
  { value: "all", label: "All" },
  { value: "10y", label: "10Y" },
  { value: "5y", label: "5Y" },
  { value: "2y", label: "2Y" },
  { value: "1y", label: "1Y" },
];

export function MaintenanceHistory({
  vehicleId,
  records,
  modifications,
  isMetric,
  initiallyAdding,
  initialRange,
}: MaintenanceHistoryProps) {
  const mileageLabel = isMetric ? "km" : "mi";
  const today = new Date();
  const todayValue = toDateInputValue(today);
  const range = normalizeTimelineRange(initialRange);
  const [selectedId, setSelectedId] = useState(
    records[0]
      ? timelineId("record", records[0].id)
      : modifications[0]
        ? timelineId("modification", modifications[0].id)
        : null
  );
  const selectedRecord =
    records.find((record) => timelineId("record", record.id) === selectedId) ?? null;
  const selectedModification =
    modifications.find((modification) => timelineId("modification", modification.id) === selectedId) ??
    null;
  const totalTimelineEvents = records.length + modifications.length;
  const timelineRecords = useMemo(
    () =>
      [...records].sort(
        (first, second) => new Date(first.date).getTime() - new Date(second.date).getTime()
      ),
    [records]
  );
  const timelineModifications = useMemo(
    () =>
      [...modifications].sort(
        (first, second) =>
          new Date(first.installedAt).getTime() - new Date(second.installedAt).getTime()
      ),
    [modifications]
  );
  const rangeStartDate = getRangeStartDate(range, today);
  const visibleTimelineRecords =
    range === "all"
      ? timelineRecords
      : timelineRecords.filter((record) => new Date(record.date) >= rangeStartDate);
  const visibleTimelineModifications =
    range === "all"
      ? timelineModifications
      : timelineModifications.filter(
          (modification) => new Date(modification.installedAt) >= rangeStartDate
        );
  const visibleTimelineEvents =
    visibleTimelineRecords.length + visibleTimelineModifications.length;

  const firstEventTime = Math.min(
    ...visibleTimelineRecords.map((record) => new Date(record.date).getTime()),
    ...visibleTimelineModifications.map((modification) =>
      new Date(modification.installedAt).getTime()
    )
  );
  const firstEventDate = Number.isFinite(firstEventTime) ? new Date(firstEventTime) : rangeStartDate;
  const startDate = startOfDay(range === "all" ? firstEventDate : rangeStartDate);
  const endDate = startOfDay(today);
  const totalTime = Math.max(1, endDate.getTime() - startDate.getTime());
  const maxMileage = Math.max(
    0,
    ...visibleTimelineRecords.map((record) => record.mileage),
    ...visibleTimelineModifications.map((modification) => modification.mileage)
  );
  const chartMaxMileage = maxMileage + getChartMileagePadding(isMetric);
  const chartPoints = visibleTimelineRecords.map((record) => ({
    record,
    ...getChartPosition(record, startDate, totalTime, chartMaxMileage),
  }));
  const modificationPoints = visibleTimelineModifications.map((modification) => ({
    modification,
    ...getModificationChartPosition(modification, startDate, totalTime, chartMaxMileage),
  }));
  const timelinePoints = [
    ...chartPoints.map((point) => ({
      id: point.record.id,
      selectionId: timelineId("record", point.record.id),
      date: new Date(point.record.date),
      x: point.x,
      y: point.y,
    })),
    ...modificationPoints.map((point) => ({
      id: point.modification.id,
      selectionId: timelineId("modification", point.modification.id),
      date: new Date(point.modification.installedAt),
      x: point.x,
      y: point.y,
    })),
  ].sort((first, second) => {
    const timeDifference = first.date.getTime() - second.date.getTime();
    return timeDifference === 0 ? first.id.localeCompare(second.id) : timeDifference;
  });
  const xAxisTicks = getXAxisTicks(startDate, endDate, totalTime);

  return (
    <section id="vehicle-timeline" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Vehicle Timeline ({totalTimelineEvents})
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {totalTimelineEvents === 0
              ? "Add the first service, inspection, repair, or build-list install."
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
        {!initiallyAdding && (
          <a
            href={`/vehicle/${vehicleId}?addEvent=1&range=${range}#add-event-form`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            Add Event
          </a>
        )}
      </div>

      {totalTimelineEvents > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {rangeOptions.map((option) => (
            <a
              key={option.value}
              href={`/vehicle/${vehicleId}?range=${option.value}#vehicle-timeline`}
              className={`min-w-12 rounded-lg border px-3 py-1.5 font-medium transition ${
                range === option.value
                  ? "border-slate-500 bg-slate-800 text-white"
                  : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
            >
              {option.label}
            </a>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        {totalTimelineEvents === 0 ? (
          <div className="flex h-64 items-center justify-center border border-dashed border-slate-700 text-sm text-slate-500">
            No timeline events yet.
          </div>
        ) : visibleTimelineEvents === 0 ? (
          <div className="flex h-64 items-center justify-center border border-dashed border-slate-700 text-sm text-slate-500">
            No events in this range.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="relative h-80 border-l border-b border-slate-700 pl-8 pr-4 pt-4">
              <div className="absolute left-2 top-3 text-xs text-slate-500">
                {formatNumber(displayMileage(chartMaxMileage, isMetric))} {mileageLabel}
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
                {timelinePoints.length > 1 && (
                  <polyline
                    points={timelinePoints.map((point) => `${point.x},${point.y}`).join(" ")}
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
                {modificationPoints.map(({ modification, x, y }) => (
                  <button
                    key={modification.id}
                    type="button"
                    title={`${modification.name}: ${formatNumber(displayMileage(modification.mileage, isMetric))} ${mileageLabel}`}
                    onClick={() => setSelectedId(timelineId("modification", modification.id))}
                    onMouseEnter={() => setSelectedId(timelineId("modification", modification.id))}
                    onFocus={() => setSelectedId(timelineId("modification", modification.id))}
                    className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-violet-400 outline-none ring-offset-2 ring-offset-slate-900 transition hover:scale-125 focus:ring-2 focus:ring-white ${
                      selectedId === timelineId("modification", modification.id)
                        ? "scale-125 ring-2 ring-white"
                        : ""
                    }`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <span className="sr-only">{modification.name}</span>
                  </button>
                ))}
                {chartPoints.map(({ record, x, y }) => {
                  const style = categoryStyles[record.category];

                  return (
                    <button
                      key={record.id}
                      type="button"
                      title={`${record.title}: ${formatNumber(displayMileage(record.mileage, isMetric))} ${mileageLabel}`}
                      onClick={() => setSelectedId(timelineId("record", record.id))}
                      onMouseEnter={() => setSelectedId(timelineId("record", record.id))}
                      onFocus={() => setSelectedId(timelineId("record", record.id))}
                      className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 ${style.dot} outline-none ring-offset-2 ring-offset-slate-900 transition hover:scale-125 focus:ring-2 focus:ring-white ${
                        selectedId === timelineId("record", record.id) ? "scale-125 ring-2 ring-white" : ""
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

            <div className="space-y-5 border-t border-slate-800 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              {selectedRecord && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${categoryStyles[selectedRecord.category].text}`}>
                    {selectedRecord.category}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{selectedRecord.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatDate(selectedRecord.date)} at{" "}
                    {formatNumber(displayMileage(selectedRecord.mileage, isMetric))} {mileageLabel}
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
              {selectedModification && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                    {selectedModification.category}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {selectedModification.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatDate(selectedModification.installedAt)} at{" "}
                    {formatNumber(displayMileage(selectedModification.mileage, isMetric))}{" "}
                    {mileageLabel}
                  </p>
                  {(selectedModification.manufacturer || selectedModification.productName) && (
                    <p className="mt-1 text-sm text-slate-400">
                      {[selectedModification.manufacturer, selectedModification.productName]
                        .filter(Boolean)
                        .join(" - ")}
                    </p>
                  )}
                  {selectedModification.cost !== null && (
                    <p className="mt-1 text-sm text-slate-400">
                      Cost: {formatCost(selectedModification.cost)}
                    </p>
                  )}
                  {selectedModification.notes && (
                    <p className="mt-4 text-sm text-slate-300">{selectedModification.notes}</p>
                  )}
                </div>
              )}
              {visibleTimelineModifications.length > 0 && (
                <div className="border-t border-slate-800 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                    Build Installs
                  </p>
                  <div className="mt-3 space-y-3">
                    {visibleTimelineModifications.map((modification) => (
                      <div key={modification.id} className="border-l border-violet-500/50 pl-3">
                        <p className="text-sm font-medium text-white">{modification.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDate(modification.installedAt)} - {modification.category} -{" "}
                          {formatNumber(displayMileage(modification.mileage, isMetric))} {mileageLabel}
                        </p>
                        {(modification.manufacturer || modification.productName) && (
                          <p className="mt-1 text-xs text-slate-400">
                            {[modification.manufacturer, modification.productName]
                              .filter(Boolean)
                              .join(" - ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
          </div>
        )}
      </div>

      {initiallyAdding && (
        <form
          id="add-event-form"
          action={createMaintenanceRecord.bind(null, vehicleId)}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <h3 className="text-sm font-semibold text-white">Add Event</h3>
          <MaintenanceFields isMetric={isMetric} maxDate={todayValue} />
          <div className="mt-4 flex flex-wrap gap-3">
            <SubmitButton label="Add Event" pendingLabel="Adding..." />
            <a
              href={`/vehicle/${vehicleId}`}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              Cancel
            </a>
          </div>
        </form>
      )}

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
                {record.category} - {formatNumber(displayMileage(record.mileage, isMetric))}{" "}
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
  const x = getDatePosition(new Date(record.date), startDate, totalTime);
  const y = 100 - (record.mileage / chartMaxMileage) * 100;

  return {
    x,
    y: clampPercentage(y),
  };
}

function getModificationChartPosition(
  modification: ModificationDetail,
  startDate: Date,
  totalTime: number,
  chartMaxMileage: number
) {
  const x = getDatePosition(new Date(modification.installedAt), startDate, totalTime);
  const y = 100 - (modification.mileage / chartMaxMileage) * 100;

  return {
    x,
    y: clampPercentage(y),
  };
}

function getDatePosition(date: Date, startDate: Date, totalTime: number) {
  return clampPercentage(((startOfDay(date).getTime() - startDate.getTime()) / totalTime) * 100);
}

function getRangeStartDate(range: TimelineRange, today: Date) {
  const startDate = startOfDay(today);

  switch (range) {
    case "10y":
      return new Date(startDate.getFullYear() - 10, startDate.getMonth(), startDate.getDate());
    case "5y":
      return new Date(startDate.getFullYear() - 5, startDate.getMonth(), startDate.getDate());
    case "2y":
      return new Date(startDate.getFullYear() - 2, startDate.getMonth(), startDate.getDate());
    case "1y":
      return new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
    case "all":
      return startDate;
  }
}

function normalizeTimelineRange(value?: string): TimelineRange {
  return rangeOptions.some((option) => option.value === value) ? (value as TimelineRange) : "all";
}

function getChartMileagePadding(isMetric: boolean) {
  return isMetric ? 150_000 : 160_934;
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

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function timelineId(type: "record" | "modification", id: string) {
  return `${type}:${id}`;
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

const selectClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
