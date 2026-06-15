import "server-only";

import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { BodyType, UnitSystem } from "@prisma/client";

export { BodyType, UnitSystem };

export type ModificationDetail = {
  id: string;
  name: string;
  category: string;
  installedAt: string;
  notes: string | null;
};

export type MaintenanceRecordDetail = {
  id: string;
  title: string;
  date: string;
  mileage: number;
  notes: string | null;
};

export type VehicleListItem = {
  id: string;
  nickname: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  mileage: number;
  modificationCount: number;
  maintenanceRecordCount: number;
};

export type VehicleDetail = {
  id: string;
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
  purchasedAt: string | null;
  purchasePrice: number | null;
  notes: string | null;
  modifications: ModificationDetail[];
  maintenanceHistory: MaintenanceRecordDetail[];
};

export type GarageStats = {
  totalVehicles: number;
  totalModifications: number;
  totalMaintenanceRecords: number;
  oldestVehicleYear: number | null;
};

export type GarageOverview = {
  stats: GarageStats;
  vehicles: VehicleListItem[];
  unitSystem: UnitSystem;
};

export async function getGarageUnitSystem(): Promise<UnitSystem> {
  await connection();

  const garage = await prisma.garage.findFirst({
    select: { unitSystem: true },
    orderBy: { createdAt: "asc" },
  });

  return garage?.unitSystem ?? UnitSystem.Imperial;
}

export async function getGarageOverview(): Promise<GarageOverview> {
  await connection();

  const [garage, vehicles, vehicleAggregate, totalModifications, totalMaintenanceRecords] =
    await prisma.$transaction([
      prisma.garage.findFirst({
        select: { unitSystem: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.vehicle.findMany({
        orderBy: [{ year: "asc" }, { make: "asc" }, { model: "asc" }],
        include: {
          _count: {
            select: {
              modifications: true,
              maintenanceRecords: true,
            },
          },
        },
      }),
      prisma.vehicle.aggregate({
        _count: {
          _all: true,
        },
        _min: {
          year: true,
        },
      }),
      prisma.modification.count(),
      prisma.maintenanceRecord.count(),
    ]);

  return {
    stats: {
      totalVehicles: vehicleAggregate._count._all,
      totalModifications,
      totalMaintenanceRecords,
      oldestVehicleYear: vehicleAggregate._min.year,
    } satisfies GarageStats,
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      nickname: vehicle.nickname,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      color: vehicle.color,
      mileage: vehicle.mileage,
      modificationCount: vehicle._count.modifications,
      maintenanceRecordCount: vehicle._count.maintenanceRecords,
    })) satisfies VehicleListItem[],
    unitSystem: garage?.unitSystem ?? UnitSystem.Imperial,
  };
}

export async function getVehicleById(id: string) {
  await connection();

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      modifications: {
        orderBy: [{ installedAt: "desc" }, { createdAt: "desc" }],
      },
      maintenanceRecords: {
        orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
      },
      garage: {
        select: { unitSystem: true },
      },
    },
  });

  if (!vehicle) {
    return null;
  }

  return {
    vehicle: {
      id: vehicle.id,
      nickname: vehicle.nickname,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      registrationNumber: vehicle.registrationNumber,
      bodyType: vehicle.bodyType,
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      horsepower: vehicle.horsepower,
      torque: vehicle.torque,
      color: vehicle.color,
      mileage: vehicle.mileage,
      purchasedAt: vehicle.purchasedAt?.toISOString().slice(0, 10) ?? null,
      purchasePrice: vehicle.purchasePrice,
      notes: vehicle.notes,
      modifications: vehicle.modifications.map((modification) => ({
        id: modification.id,
        name: modification.name,
        category: modification.category,
        installedAt: modification.installedAt.toISOString(),
        notes: modification.notes,
      })),
      maintenanceHistory: vehicle.maintenanceRecords.map((record) => ({
        id: record.id,
        title: record.title,
        date: record.performedAt.toISOString(),
        mileage: record.mileage,
        notes: record.notes,
      })),
    } satisfies VehicleDetail,
    unitSystem: vehicle.garage.unitSystem,
  };
}
