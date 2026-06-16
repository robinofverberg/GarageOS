"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  deleteVehiclePhoto,
  setFeaturedVehiclePhoto,
  updateVehicleVisibility,
  uploadVehiclePhoto,
} from "@/app/garage/actions";
import { SubmitButton } from "@/components/submit-button";
import type { MaintenanceRecordDetail, ModificationDetail, PhotoDetail } from "@/lib/garage-data";

type PhotoGalleryProps = {
  vehicleId: string;
  publicSlug: string;
  isPublic: boolean;
  featuredPhotoId: string | null;
  photos: PhotoDetail[];
  modifications: ModificationDetail[];
  maintenanceRecords: MaintenanceRecordDetail[];
};

export function PhotoGallery({
  vehicleId,
  publicSlug,
  isPublic,
  featuredPhotoId,
  photos,
  modifications,
  maintenanceRecords,
}: PhotoGalleryProps) {
  const publicUrl = `/build/${publicSlug}`;
  const [addingPhoto, setAddingPhoto] = useState(false);

  async function uploadPhoto(formData: FormData) {
    await uploadVehiclePhoto(vehicleId, formData);
    setAddingPhoto(false);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Photo Gallery ({photos.length})
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {photos.length === 0
              ? "Upload photos for this vehicle, build entries, or maintenance events."
              : "Choose a featured image for the vehicle and public build card."}
          </p>
        </div>
        <form action={updateVehicleVisibility.bind(null, vehicleId)} className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={isPublic}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950"
            />
            Public
          </label>
          <SubmitButton label="Save" pendingLabel="Saving..." />
          {isPublic && (
            <a href={publicUrl} className="text-sm text-slate-400 transition hover:text-white">
              View Build Card
            </a>
          )}
        </form>
      </div>

      {!addingPhoto && (
        <button
          type="button"
          onClick={() => setAddingPhoto(true)}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
        >
          Add Photo
        </button>
      )}

      {addingPhoto && (
        <form
          action={uploadPhoto}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Add Photo</h3>
            <button
              type="button"
              onClick={() => setAddingPhoto(false)}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="space-y-4">
              <Field label="Image *" htmlFor="vehicle-photo">
                <input
                  id="vehicle-photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  className={fileInputClass}
                />
              </Field>
              <Field label="Caption" htmlFor="photo-caption">
                <input
                  id="photo-caption"
                  name="caption"
                  type="text"
                  placeholder="e.g. Fresh paint after correction"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="space-y-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="makeFeatured"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />
                Set as featured image
              </label>
              <SubmitButton label="Upload Photo" pendingLabel="Uploading..." />
            </div>
          </div>
        </form>
      )}

      {photos.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
          No photos uploaded yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              vehicleId={vehicleId}
              photo={photo}
              featured={photo.id === featuredPhotoId}
              attachmentLabel={getAttachmentLabel(photo, modifications, maintenanceRecords)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PhotoCard({
  vehicleId,
  photo,
  featured,
  attachmentLabel,
}: {
  vehicleId: string;
  photo: PhotoDetail;
  featured: boolean;
  attachmentLabel: string;
}) {
  const [isDeleting, startDeleting] = useTransition();

  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="relative aspect-[4/3] bg-slate-950">
        <Image
          src={photo.url}
          alt={photo.caption ?? "Vehicle photo"}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        {featured && (
          <span className="absolute left-3 top-3 rounded-md bg-slate-950/85 px-2 py-1 text-xs font-medium text-white">
            Featured
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          {photo.caption && <p className="text-sm font-medium text-white">{photo.caption}</p>}
          <p className="mt-1 text-xs text-slate-500">{attachmentLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!featured && (
            <form action={setFeaturedVehiclePhoto.bind(null, vehicleId, photo.id)}>
              <SubmitButton label="Feature" pendingLabel="Setting..." />
            </form>
          )}
          <button
            type="button"
            onClick={() =>
              startDeleting(async () => {
                if (!window.confirm("Delete this photo?")) {
                  return;
                }

                await deleteVehiclePhoto(photo.id);
              })
            }
            disabled={isDeleting}
            className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-700 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

function getAttachmentLabel(
  photo: PhotoDetail,
  modifications: ModificationDetail[],
  maintenanceRecords: MaintenanceRecordDetail[]
) {
  if (photo.modificationId) {
    return `Attached to ${modifications.find((modification) => modification.id === photo.modificationId)?.name ?? "modification"}`;
  }

  if (photo.maintenanceRecordId) {
    return `Attached to ${maintenanceRecords.find((record) => record.id === photo.maintenanceRecordId)?.title ?? "maintenance event"}`;
  }

  return "Vehicle gallery";
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
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

const fileInputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-600 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
