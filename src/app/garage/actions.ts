"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, newId, now } from "@/lib/supabase";
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
  const vehicle = await findOwnedVehicleUnitSystem(vehicleId, user.sub);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const isMetric = vehicle.unitSystem === UnitSystem.Metric;
  const input = parseMaintenanceRecordInput(formData);

  await supabase.from("MaintenanceRecord").insert({
    id: newId(),
    vehicleId,
    ...input,
    mileage: inputMileageToKm(input.mileage, isMetric),
    updatedAt: now(),
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function updateMaintenanceRecord(recordId: string, formData: FormData) {
  const user = await requireUser();
  const { data: record } = await supabase
    .from("MaintenanceRecord")
    .select("id, vehicleId, Vehicle!inner(Garage!inner(unitSystem, userId))")
    .eq("id", recordId)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!record) {
    throw new Error("Maintenance record not found.");
  }

  const isMetric = nestedUnitSystem(record) === UnitSystem.Metric;
  const input = parseMaintenanceRecordInput(formData);

  await supabase
    .from("MaintenanceRecord")
    .update({
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
      updatedAt: now(),
    })
    .eq("id", recordId);

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
  const vehicle = await findOwnedVehicleUnitSystem(vehicleId, user.sub);

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const isMetric = vehicle.unitSystem === UnitSystem.Metric;
  const input = parseModificationInput(formData);

  await supabase.from("Modification").insert({
    id: newId(),
    vehicleId,
    ...input,
    mileage: inputMileageToKm(input.mileage, isMetric),
    updatedAt: now(),
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function updateModification(modificationId: string, formData: FormData) {
  const user = await requireUser();
  const { data: modification } = await supabase
    .from("Modification")
    .select("id, vehicleId, Vehicle!inner(Garage!inner(unitSystem, userId))")
    .eq("id", modificationId)
    .eq("Vehicle.Garage.userId", user.sub)
    .maybeSingle();

  if (!modification) {
    throw new Error("Modification not found.");
  }

  const isMetric = nestedUnitSystem(modification) === UnitSystem.Metric;
  const input = parseModificationInput(formData);

  await supabase
    .from("Modification")
    .update({
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
      updatedAt: now(),
    })
    .eq("id", modificationId);

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

/** Loads a vehicle's garage unit system, scoped to the owning user. */
async function findOwnedVehicleUnitSystem(
  vehicleId: string,
  userId: string
): Promise<{ unitSystem: UnitSystem } | null> {
  const { data } = await supabase
    .from("Vehicle")
    .select("id, Garage!inner(unitSystem, userId)")
    .eq("id", vehicleId)
    .eq("Garage.userId", userId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    unitSystem: (data.Garage as unknown as { unitSystem: UnitSystem }).unitSystem,
  };
}

/** Extracts unitSystem from a Modification/MaintenanceRecord -> Vehicle -> Garage join. */
function nestedUnitSystem(row: {
  Vehicle: unknown;
}): UnitSystem {
  const vehicle = row.Vehicle as { Garage: { unitSystem: UnitSystem } };
  return vehicle.Garage.unitSystem;
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
    installedAt: parsePastOrTodayDate(formData, "installedAt"),
    mileage: parseInteger(formData, "mileage", { min: 0 }),
    cost: parseOptionalPositiveFloat(formData, "cost"),
    notes: parseOptionalString(formData, "notes"),
  };
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

