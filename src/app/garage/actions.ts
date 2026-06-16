"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BodyType, UnitSystem } from "@prisma/client";
import type { MaintenanceCategory } from "@prisma/client";
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
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: { unitSystem: true },
  });
  const isMetric = garage?.unitSystem === UnitSystem.Metric;
  const input = parseVehicleInput(formData);
  const vehicle = await prisma.vehicle.create({
    data: {
      garageId,
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicle.id}`);

  redirect(`/vehicle/${vehicle.id}`);
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const existing = await prisma.vehicle.findFirst({
    where: { id: vehicleId, garage: { userId: user.sub } },
    select: { garage: { select: { unitSystem: true } } },
  });
  if (!existing) {
    throw new Error("Vehicle not found.");
  }
  const isMetric = existing.garage.unitSystem === UnitSystem.Metric;
  const input = parseVehicleInput(formData);

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { ...input, mileage: inputMileageToKm(input.mileage, isMetric) },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);
  revalidatePath(`/vehicle/${vehicleId}/edit`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function deleteVehicle(vehicleId: string) {
  const user = await requireUser();
  await prisma.vehicle.deleteMany({
    where: { id: vehicleId, garage: { userId: user.sub } },
  });

  revalidatePath("/garage");

  redirect("/garage");
}

export async function createMaintenanceRecord(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, garage: { userId: user.sub } },
    select: { id: true, garage: { select: { unitSystem: true } } },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const isMetric = vehicle.garage.unitSystem === UnitSystem.Metric;
  const input = parseMaintenanceRecordInput(formData);

  await prisma.maintenanceRecord.create({
    data: {
      vehicleId,
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function updateMaintenanceRecord(recordId: string, formData: FormData) {
  const user = await requireUser();
  const record = await prisma.maintenanceRecord.findFirst({
    where: { id: recordId, vehicle: { garage: { userId: user.sub } } },
    select: {
      id: true,
      vehicleId: true,
      vehicle: { select: { garage: { select: { unitSystem: true } } } },
    },
  });

  if (!record) {
    throw new Error("Maintenance record not found.");
  }

  const isMetric = record.vehicle.garage.unitSystem === UnitSystem.Metric;
  const input = parseMaintenanceRecordInput(formData);

  await prisma.maintenanceRecord.update({
    where: { id: recordId },
    data: {
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${record.vehicleId}`);
}

export async function deleteMaintenanceRecord(recordId: string) {
  const user = await requireUser();
  const record = await prisma.maintenanceRecord.findFirst({
    where: { id: recordId, vehicle: { garage: { userId: user.sub } } },
    select: { vehicleId: true },
  });

  if (!record) {
    throw new Error("Maintenance record not found.");
  }

  await prisma.maintenanceRecord.delete({
    where: { id: recordId },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${record.vehicleId}`);
}

export async function createModification(vehicleId: string, formData: FormData) {
  const user = await requireUser();
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, garage: { userId: user.sub } },
    select: { id: true, garage: { select: { unitSystem: true } } },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found.");
  }

  const isMetric = vehicle.garage.unitSystem === UnitSystem.Metric;
  const input = parseModificationInput(formData);

  await prisma.modification.create({
    data: {
      vehicleId,
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);

  redirect(`/vehicle/${vehicleId}`);
}

export async function updateModification(modificationId: string, formData: FormData) {
  const user = await requireUser();
  const modification = await prisma.modification.findFirst({
    where: { id: modificationId, vehicle: { garage: { userId: user.sub } } },
    select: {
      id: true,
      vehicleId: true,
      vehicle: { select: { garage: { select: { unitSystem: true } } } },
    },
  });

  if (!modification) {
    throw new Error("Modification not found.");
  }

  const isMetric = modification.vehicle.garage.unitSystem === UnitSystem.Metric;
  const input = parseModificationInput(formData);

  await prisma.modification.update({
    where: { id: modificationId },
    data: {
      ...input,
      mileage: inputMileageToKm(input.mileage, isMetric),
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${modification.vehicleId}`);
}

export async function deleteModification(modificationId: string) {
  const user = await requireUser();
  const modification = await prisma.modification.findFirst({
    where: { id: modificationId, vehicle: { garage: { userId: user.sub } } },
    select: { vehicleId: true },
  });

  if (!modification) {
    throw new Error("Modification not found.");
  }

  await prisma.modification.delete({
    where: { id: modificationId },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${modification.vehicleId}`);
}

export async function updateGarageUnitSystem(formData: FormData) {
  const user = await requireUser();
  const value = formData.get("unitSystem");

  if (value !== "Metric" && value !== "Imperial") {
    throw new Error("Invalid unit system.");
  }

  const garage = await prisma.garage.findFirst({
    where: { userId: user.sub },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!garage) {
    await prisma.garage.create({
      data: {
        userId: user.sub,
        slug: user.sub,
        name: "My Garage",
        description: "My GarageOS garage.",
        unitSystem: value as UnitSystem,
      },
    });
  } else {
    await prisma.garage.update({
      where: { id: garage.id },
      data: { unitSystem: value as UnitSystem },
    });
  }

  revalidatePath("/garage");
  revalidatePath("/vehicle");
  revalidatePath("/profile");
}

async function getPrimaryGarageId(userId: string): Promise<string> {
  const existingGarage = await prisma.garage.findFirst({
    where: { userId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingGarage) {
    return existingGarage.id;
  }

  const garage = await prisma.garage.create({
    data: {
      userId,
      slug: userId,
      name: "My Garage",
      description: "My GarageOS garage.",
    },
    select: { id: true },
  });

  return garage.id;
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

