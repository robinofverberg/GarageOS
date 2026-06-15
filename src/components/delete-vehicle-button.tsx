"use client";

import { useState, useTransition } from "react";
import { deleteVehicle } from "@/app/garage/actions";

type DeleteVehicleButtonProps = {
  vehicleId: string;
  vehicleLabel: string;
};

export function DeleteVehicleButton({ vehicleId, vehicleLabel }: DeleteVehicleButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteVehicle(vehicleId);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-700 hover:text-red-300"
      >
        Delete Vehicle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Delete vehicle?</h2>
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-medium text-slate-200">{vehicleLabel}</span> will be
              permanently removed from your garage. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
