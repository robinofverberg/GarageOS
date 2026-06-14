"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type VehicleInput = {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  mileage: number;
  purchasedAt: Date | null;
  notes: string | null;
};

export async function createVehicle(formData: FormData) {
  const input = parseVehicleInput(formData);
  const garageId = await getPrimaryGarageId();
  const vehicle = await prisma.vehicle.create({
    data: {
      garageId,
      ...input,
    },
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicle.id}`);

  redirect(`/vehicle/${vehicle.id}`);
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const input = parseVehicleInput(formData);

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: input,
  });

  revalidatePath("/garage");
  revalidatePath(`/vehicle/${vehicleId}`);
  revalidatePath(`/vehicle/${vehicleId}/edit`);

  redirect(`/vehicle/${vehicleId}`);
}

async function getPrimaryGarageId() {
  const existingGarage = await prisma.garage.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingGarage) {
    return existingGarage.id;
  }

  const garage = await prisma.garage.create({
    data: {
      slug: "default-garage",
      name: "Default Garage",
      description: "Automatically created GarageOS garage.",
    },
    select: { id: true },
  });

  return garage.id;
}

function parseVehicleInput(formData: FormData): VehicleInput {
  return {
    year: parseInteger(formData, "year", { min: 1886 }),
    make: parseString(formData, "make", { required: true }),
    model: parseString(formData, "model", { required: true }),
    trim: parseOptionalString(formData, "trim"),
    color: parseOptionalString(formData, "color"),
    mileage: parseInteger(formData, "mileage", { min: 0, fallback: 0 }),
    purchasedAt: parseOptionalDate(formData, "purchasedAt"),
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

function parseInteger(
  formData: FormData,
  field: string,
  options: { min?: number; fallback?: number } = {}
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
