"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, newId, now, PHOTO_BUCKET } from "@/lib/supabase";
import { requireUser } from "@/lib/session";
import { BodyType, UnitSystem, MaintenanceCategory } from "@/lib/garage-data";
import { inputMileageToKm } from "@/lib/units";

const maintenanceCategories = [
  "Service",
  "Inspection",
  "Repair",
  "Modification",
  "Tires",
  "Fluids",
  "Other",
] satisfies MaintenanceCategory[];

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const maxPhotoSize = 6 * 1024 * 1024;

type VehicleInput = {
  nickname: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  registrationNumber: string | null;
  bodyType: BodyType | null;
  engine: string | null;
  transmission: string | null;
  fuelType: string | null;
  horsepower: number | null;
  torque: number | null;
  color: string | null;
  mileage: number;
  purchasedAt: Date | null;
  purchasePrice: number | null;
  notes: string | null;
};

type MaintenanceRecordInput = {
  title: string;
  category: MaintenanceCategory;
  performedAt: Date;
  mileage: number;
  cost: number | null;
  notes: string | null;
};

type ModificationInput = {
  name: string;
  category: string;
  manufacturer: string | null;
  productName: string | null;
  productUrl: string | null;
  installedAt: Date;
  mileage: number;
  cost: number | null;
  notes: string | null;
};

export async function createVehicle(formData: FormData) {
  const user = await requireUser();
  const garageId = await getPrimaryGarageId(user.sub);
  const { data: garage } = await supabase
    .from("Garage")
    .select("unitSystem")
    .eq("id", garageId)
    .maybeSingle();
  const isMetric = garage?.unitSystem === UnitSystem.Metric;
  const input = parseVehicleInput(formData);
  const { data: vehicle, error } = await supabase
    .from("Vehicle")
    .insert({
      id: newId(),
      garageId,
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
      updatedAt: now(),
    })
    .select("id")
    .single();

  if (error || !vehicle) {
    throw new Error("Could not create vehicle.");
  }

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicle.id}`);

  redirect(`/vehicle/${vehicle.id}`);
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const { data: existing } = await supabase
    .from("Vehicle")
    .select("id, Garage!inner(unitSystem, userId)")
    .eq("id", vehicleId)
    .eq("Garage.userId", user.sub)
    .maybeSingle();
  if (!existing) {
    throw new Error("Vehicle not found.");
  }
  const isMetric =
    (existing.Garage as unknown as { unitSystem: UnitSystem }).unitSystem ===
    UnitSystem.Metric;
  const input = parseVehicleInput(formData);

  await supabase
    .from("Vehicle")
    .update({
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
      updatedAt: now(),
    })
    .eq("id", vehicleId);

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);
  revalidatePath(`/vehicle/${vehicleId}/edit`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function deleteVehicle(vehicleId: string) {
  const user = await requireUser();
  const { data: existing } = await supabase
    .from("Vehicle")
    .select("id, Garage!inner(userId)")
    .eq("id", vehicleId)
    .eq("Garage.userId", user.sub)
    .maybeSingle();

  if (existing) {
    await supabase.from("Vehicle").delete().eq("id", vehicleId);
  }

  revalidatePath("/garage");

  redirect("/garage");
}

export async function createMaintenanceRecord(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const vehicle = await findOwnedVehicleForEvent(vehicleId, user.sub);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const isMetric = vehicle.unitSystem === UnitSystem.Metric;
  const input = parseMaintenanceRecordInput(formData);

  const recordId = newId();
  const { error } = await supabase.from("MaintenanceRecord").insert({
    id: recordId,
    vehicleId,
    ...input,
    mileage: inputMileageToKm(input.mileage, isMetric),
    updatedAt: now(),
  });

  if (error) {
    throw new Error("Could not create maintenance record.");
  }

  await createOptionalEventPhoto({
    formData,
    vehicleId,
    publicSlug: vehicle.publicSlug,
    featuredPhotoId: vehicle.featuredPhotoId,
    maintenanceRecordId: recordId,
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function updateMaintenanceRecord(recordId: string, formData: FormData) {
  const user = await requireUser();
  const { data: record } = await supabase
    .from("MaintenanceRecord")
    .select(
      "id, vehicleId, Vehicle!inner(publicSlug, featuredPhotoId, Garage!inner(unitSystem, userId))"
    )
    .eq("id", recordId)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!record) {
    throw new Error("Maintenance record not found.");
  }

  const vehicle = eventVehicle(record);
  const isMetric = vehicle.unitSystem === UnitSystem.Metric;
  const input = parseMaintenanceRecordInput(formData);

  await supabase
    .from("MaintenanceRecord")
    .update({
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
      updatedAt: now(),
    })
    .eq("id", recordId);

  await createOptionalEventPhoto({
    formData,
    vehicleId: record.vehicleId as string,
    publicSlug: vehicle.publicSlug,
    featuredPhotoId: vehicle.featuredPhotoId,
    maintenanceRecordId: record.id as string,
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${record.vehicleId}`);
}

export async function deleteMaintenanceRecord(recordId: string) {
  const user = await requireUser();
  const { data: record } = await supabase
    .from("MaintenanceRecord")
    .select("vehicleId, Vehicle!inner(Garage!inner(userId))")
    .eq("id", recordId)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!record) {
    throw new Error("Maintenance record not found.");
  }

  await supabase.from("MaintenanceRecord").delete().eq("id", recordId);

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${record.vehicleId}`);
}

export async function createModification(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const vehicle = await findOwnedVehicleForEvent(vehicleId, user.sub);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const isMetric = vehicle.unitSystem === UnitSystem.Metric;
  const input = parseModificationInput(formData);

  const modificationId = newId();
  const { error } = await supabase.from("Modification").insert({
    id: modificationId,
    vehicleId,
    ...input,
    mileage: inputMileageToKm(input.mileage, isMetric),
    updatedAt: now(),
  });

  if (error) {
    throw new Error("Could not create modification.");
  }

  await createOptionalEventPhoto({
    formData,
    vehicleId,
    publicSlug: vehicle.publicSlug,
    featuredPhotoId: vehicle.featuredPhotoId,
    modificationId,
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function updateModification(modificationId: string, formData: FormData) {
  const user = await requireUser();
  const { data: modification } = await supabase
    .from("Modification")
    .select(
      "id, vehicleId, Vehicle!inner(publicSlug, featuredPhotoId, Garage!inner(unitSystem, userId))"
    )
    .eq("id", modificationId)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!modification) {
    throw new Error("Modification not found.");
  }

  const vehicle = eventVehicle(modification);
  const isMetric = vehicle.unitSystem === UnitSystem.Metric;
  const input = parseModificationInput(formData);

  await supabase
    .from("Modification")
    .update({
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
      updatedAt: now(),
    })
    .eq("id", modificationId);

  await createOptionalEventPhoto({
    formData,
    vehicleId: modification.vehicleId as string,
    publicSlug: vehicle.publicSlug,
    featuredPhotoId: vehicle.featuredPhotoId,
    modificationId: modification.id as string,
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${modification.vehicleId}`);
}

export async function deleteModification(modificationId: string) {
  const user = await requireUser();
  const { data: modification } = await supabase
    .from("Modification")
    .select("vehicleId, Vehicle!inner(Garage!inner(userId))")
    .eq("id", modificationId)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!modification) {
    throw new Error("Modification not found.");
  }

  await supabase.from("Modification").delete().eq("id", modificationId);

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${modification.vehicleId}`);
}

export async function uploadVehiclePhoto(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const vehicle = await findOwnedVehicleForEvent(vehicleId, user.sub);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const file = parsePhotoFile(formData);
  const caption = parseOptionalString(formData, "caption");
  const photo = await createPhoto({
    file,
    vehicleId,
    caption,
    isGallery: true,
  });

  if (!vehicle.featuredPhotoId || formData.get("makeFeatured") === "on") {
    await supabase
      .from("Vehicle")
      .update({ featuredPhotoId: photo.id, updatedAt: now() })
      .eq("id", vehicleId);
  }

  revalidateVehicleSurfaces(vehicleId, vehicle.publicSlug);
}

export async function setFeaturedVehiclePhoto(vehicleId: string, photoId: string) {
  const user = await requireUser();
  const { data: photo } = await supabase
    .from("Photo")
    .select("id, Vehicle!inner(publicSlug, Garage!inner(userId))")
    .eq("id", photoId)
    .eq("vehicleId", vehicleId)
    .eq("isGallery", true)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!photo) {
    throw new Error("Photo not found.");
  }

  await supabase
    .from("Vehicle")
    .update({ featuredPhotoId: photoId, updatedAt: now() })
    .eq("id", vehicleId);

  const publicSlug = (photo.Vehicle as unknown as { publicSlug: string }).publicSlug;
  revalidateVehicleSurfaces(vehicleId, publicSlug);
}

export async function deleteVehiclePhoto(photoId: string) {
  const user = await requireUser();
  const { data: photo } = await supabase
    .from("Photo")
    .select(
      "id, vehicleId, storagePath, Vehicle!inner(featuredPhotoId, publicSlug, Garage!inner(userId))"
    )
    .eq("id", photoId)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!photo) {
    throw new Error("Photo not found.");
  }

  const vehicle = photo.Vehicle as unknown as {
    featuredPhotoId: string | null;
    publicSlug: string;
  };
  const vehicleId = photo.vehicleId as string;

  await supabase.from("Photo").delete().eq("id", photoId);

  if (vehicle.featuredPhotoId === photoId) {
    const { data: replacement } = await supabase
      .from("Photo")
      .select("id")
      .eq("vehicleId", vehicleId)
      .eq("isGallery", true)
      .neq("id", photoId)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase
      .from("Vehicle")
      .update({
        featuredPhotoId: (replacement?.id as string | undefined) ?? null,
        updatedAt: now(),
      })
      .eq("id", vehicleId);
  }

  // The database row is the source of truth; a missing storage object should not block deletion.
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storagePath as string]);

  revalidateVehicleSurfaces(vehicleId, vehicle.publicSlug);
}

export async function updateVehicleVisibility(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const vehicle = await findOwnedVehicleForEvent(vehicleId, user.sub);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  await supabase
    .from("Vehicle")
    .update({ isPublic: formData.get("isPublic") === "on", updatedAt: now() })
    .eq("id", vehicleId);

  revalidateVehicleSurfaces(vehicleId, vehicle.publicSlug);
}

export async function updateGarageUnitSystem(formData: FormData) {
  const user = await requireUser();
  const value = formData.get("unitSystem");

  if (value !== "Metric" && value !== "Imperial") {
    throw new Error("Invalid unit system.");
  }

  const { data: garage } = await supabase
    .from("Garage")
    .select("id")
    .eq("userId", user.sub)
    .order("createdAt", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!garage) {
    await supabase.from("Garage").insert({
      id: newId(),
      userId: user.sub,
      slug: user.sub,
      name: "My Garage",
      description: "My GarageOS garage.",
      unitSystem: value as UnitSystem,
      updatedAt: now(),
    });
  } else {
    await supabase
      .from("Garage")
      .update({ unitSystem: value as UnitSystem, updatedAt: now() })
      .eq("id", garage.id as string);
  }

  revalidatePath("/garage");
  revalidatePath("/vehicle");
  revalidatePath("/profile");
}

async function getPrimaryGarageId(userId: string): Promise<string> {
  const { data: existingGarage } = await supabase
    .from("Garage")
    .select("id")
    .eq("userId", userId)
    .order("createdAt", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingGarage) {
    return existingGarage.id as string;
  }

  const id = newId();
  const { error } = await supabase.from("Garage").insert({
    id,
    userId,
    slug: userId,
    name: "My Garage",
    description: "My GarageOS garage.",
    updatedAt: now(),
  });

  if (error) {
    throw new Error("Could not create garage.");
  }

  return id;
}

type EventVehicle = {
  unitSystem: UnitSystem;
  publicSlug: string;
  featuredPhotoId: string | null;
};

/** Loads the fields needed to attach an event/photo to a vehicle, scoped to its owner. */
async function findOwnedVehicleForEvent(
  vehicleId: string,
  userId: string
): Promise<EventVehicle | null> {
  const { data } = await supabase
    .from("Vehicle")
    .select("id, publicSlug, featuredPhotoId, Garage!inner(unitSystem, userId)")
    .eq("id", vehicleId)
    .eq("Garage.userId", userId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    unitSystem: (data.Garage as unknown as { unitSystem: UnitSystem }).unitSystem,
    publicSlug: data.publicSlug as string,
    featuredPhotoId: data.featuredPhotoId as string | null,
  };
}

/** Extracts the owning vehicle's event fields from a Modification/MaintenanceRecord join. */
function eventVehicle(row: { Vehicle: unknown }): EventVehicle {
  const vehicle = row.Vehicle as {
    publicSlug: string;
    featuredPhotoId: string | null;
    Garage: { unitSystem: UnitSystem };
  };
  return {
    unitSystem: vehicle.Garage.unitSystem,
    publicSlug: vehicle.publicSlug,
    featuredPhotoId: vehicle.featuredPhotoId,
  };
}

function parseVehicleInput(formData: FormData): VehicleInput {
  return {
    nickname: parseOptionalString(formData, "nickname"),
    year: parseInteger(formData, "year", { min: 1886, max: new Date().getFullYear() + 1 }),
    make: parseString(formData, "make", { required: true }),
    model: parseString(formData, "model", { required: true }),
    trim: parseOptionalString(formData, "trim"),
    registrationNumber: parseOptionalRegistrationNumber(formData),
    bodyType: parseOptionalBodyType(formData),
    engine: parseOptionalString(formData, "engine"),
    transmission: parseOptionalString(formData, "transmission"),
    fuelType: parseOptionalString(formData, "fuelType"),
    horsepower: parseOptionalPositiveInteger(formData, "horsepower"),
    torque: parseOptionalPositiveInteger(formData, "torque"),
    color: parseOptionalString(formData, "color"),
    mileage: parseInteger(formData, "mileage", { min: 0, fallback: 0 }),
    purchasedAt: parseOptionalDate(formData, "purchasedAt"),
    purchasePrice: parseOptionalPositiveFloat(formData, "purchasePrice"),
    notes: parseOptionalString(formData, "notes"),
  };
}

function parseMaintenanceRecordInput(formData: FormData): MaintenanceRecordInput {
  return {
    title: parseString(formData, "title", { required: true }),
    category: parseMaintenanceCategory(formData),
    performedAt: parsePastOrTodayDate(formData, "performedAt"),
    mileage: parseInteger(formData, "mileage", { min: 0 }),
    cost: parseOptionalPositiveFloat(formData, "cost"),
    notes: parseOptionalString(formData, "notes"),
  };
}

function parseModificationInput(formData: FormData): ModificationInput {
  return {
    name: parseString(formData, "name", { required: true }),
    category: parseString(formData, "category", { required: true }),
    manufacturer: parseOptionalString(formData, "manufacturer"),
    productName: parseOptionalString(formData, "productName"),
    productUrl: parseOptionalUrl(formData, "productUrl"),
    installedAt: parsePastOrTodayDate(formData, "installedAt"),
    mileage: parseInteger(formData, "mileage", { min: 0 }),
    cost: parseOptionalPositiveFloat(formData, "cost"),
    notes: parseOptionalString(formData, "notes"),
  };
}

function parsePhotoFile(formData: FormData) {
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a photo to upload.");
  }

  return file;
}

function parseOptionalPhotoFile(formData: FormData) {
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

function parseString(
  formData: FormData,
  field: string,
  options: { required?: boolean } = {}
) {
  const value = formData.get(field);

  if (typeof value !== "string") {
    throw new Error(`Invalid ${field} value.`);
  }

  const trimmedValue = value.trim();

  if (options.required && !trimmedValue) {
    throw new Error(`${field} is required.`);
  }

  return trimmedValue;
}

function parseOptionalString(formData: FormData, field: string) {
  const value = parseString(formData, field);
  return value ? value : null;
}

function parseOptionalUrl(formData: FormData, field: string) {
  const value = parseOptionalString(formData, field);

  if (!value) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${field} must be a valid URL.`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`${field} must start with http:// or https://.`);
  }

  return parsedUrl.toString();
}

function parseOptionalRegistrationNumber(formData: FormData) {
  const value = parseOptionalString(formData, "registrationNumber");

  if (value && value.length > 20) {
    throw new Error("Registration number must be 20 characters or fewer.");
  }

  return value;
}

function parseOptionalBodyType(formData: FormData): BodyType | null {
  const value = parseOptionalString(formData, "bodyType");

  if (!value) {
    return null;
  }

  const validValues = Object.values(BodyType);

  if (!validValues.includes(value as BodyType)) {
    throw new Error(`Invalid body type: ${value}`);
  }

  return value as BodyType;
}

function parseMaintenanceCategory(formData: FormData): MaintenanceCategory {
  const value = parseString(formData, "category", { required: true });

  if (!maintenanceCategories.includes(value as MaintenanceCategory)) {
    throw new Error(`Invalid maintenance category: ${value}`);
  }

  return value as MaintenanceCategory;
}

function parseInteger(
  formData: FormData,
  field: string,
  options: { min?: number; max?: number; fallback?: number } = {}
) {
  const value = parseOptionalString(formData, field);

  if (value === null) {
    if (options.fallback !== undefined) {
      return options.fallback;
    }

    throw new Error(`${field} is required.`);
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid ${field} value.`);
  }

  if (options.min !== undefined && parsedValue < options.min) {
    throw new Error(`${field} must be at least ${options.min}.`);
  }

  if (options.max !== undefined && parsedValue > options.max) {
    throw new Error(`${field} must be at most ${options.max}.`);
  }

  return parsedValue;
}

function parseOptionalPositiveInteger(formData: FormData, field: string) {
  const value = parseOptionalString(formData, field);

  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    throw new Error(`Invalid ${field} value.`);
  }

  return parsedValue;
}

function parseOptionalPositiveFloat(formData: FormData, field: string) {
  const value = parseOptionalString(formData, field);

  if (!value) {
    return null;
  }

  const parsedValue = Number.parseFloat(value);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    throw new Error(`Invalid ${field} value.`);
  }

  return parsedValue;
}

function parseOptionalDate(formData: FormData, field: string) {
  const value = parseOptionalString(formData, field);

  if (!value) {
    return null;
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    throw new Error(`Invalid ${field} value.`);
  }

  return parsedValue;
}

function parseDate(formData: FormData, field: string) {
  const parsedValue = parseOptionalDate(formData, field);

  if (!parsedValue) {
    throw new Error(`${field} is required.`);
  }

  return parsedValue;
}

function parsePastOrTodayDate(formData: FormData, field: string) {
  const parsedValue = parseDate(formData, field);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (parsedValue > today) {
    throw new Error(`${field} cannot be in the future.`);
  }

  return parsedValue;
}

async function createOptionalEventPhoto({
  formData,
  vehicleId,
  publicSlug,
  featuredPhotoId,
  modificationId = null,
  maintenanceRecordId = null,
}: {
  formData: FormData;
  vehicleId: string;
  publicSlug: string;
  featuredPhotoId: string | null;
  modificationId?: string | null;
  maintenanceRecordId?: string | null;
}) {
  const file = parseOptionalPhotoFile(formData);

  if (!file) {
    return;
  }

  const isGallery = formData.get("addPhotoToGallery") === "on";
  const photo = await createPhoto({
    file,
    vehicleId,
    modificationId,
    maintenanceRecordId,
    caption: parseOptionalString(formData, "photoCaption"),
    isGallery,
  });

  if (isGallery && !featuredPhotoId) {
    await supabase
      .from("Vehicle")
      .update({ featuredPhotoId: photo.id, updatedAt: now() })
      .eq("id", vehicleId);
  }

  revalidateVehicleSurfaces(vehicleId, publicSlug);
}

async function createPhoto({
  file,
  vehicleId,
  modificationId = null,
  maintenanceRecordId = null,
  caption,
  isGallery,
}: {
  file: File;
  vehicleId: string;
  modificationId?: string | null;
  maintenanceRecordId?: string | null;
  caption: string | null;
  isGallery: boolean;
}) {
  const extension = allowedImageTypes.get(file.type);
  if (!extension) {
    throw new Error("Photos must be JPG, PNG, WEBP, or GIF images.");
  }

  if (file.size > maxPhotoSize) {
    throw new Error("Photos must be 6 MB or smaller.");
  }

  const storedFileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const storagePath = `vehicles/${vehicleId}/${storedFileName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw new Error("Could not upload photo.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);

  const id = newId();
  const { error } = await supabase.from("Photo").insert({
    id,
    vehicleId,
    modificationId,
    maintenanceRecordId,
    url: publicUrl,
    storagePath,
    fileName: file.name || storedFileName,
    contentType: file.type,
    size: file.size,
    caption,
    isGallery,
    updatedAt: now(),
  });

  if (error) {
    // Roll back the orphaned storage object if the row insert fails.
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    throw new Error("Could not save photo.");
  }

  return { id };
}

function revalidateVehicleSurfaces(vehicleId: string, publicSlug: string) {
  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);
  revalidatePath(`/build/${publicSlug}`);
}
