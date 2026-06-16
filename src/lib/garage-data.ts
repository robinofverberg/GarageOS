import "server-only";

import { connection } from "next/server";
import { supabase } from "@/lib/supabase";

export const BodyType = {
  Sedan: "Sedan",
  Wagon: "Wagon",
  Coupe: "Coupe",
  Cabriolet: "Cabriolet",
  Hatchback: "Hatchback",
  SUV: "SUV",
  Van: "Van",
  Pickup: "Pickup",
  Motorcycle: "Motorcycle",
  Other: "Other",
} as const;
export type BodyType = (typeof BodyType)[keyof typeof BodyType];

export const UnitSystem = {
  Metric: "Metric",
  Imperial: "Imperial",
} as const;
export type UnitSystem = (typeof UnitSystem)[keyof typeof UnitSystem];

export const MaintenanceCategory = {
  Service: "Service",
  Inspection: "Inspection",
  Repair: "Repair",
  Modification: "Modification",
  Tires: "Tires",
  Fluids: "Fluids",
  Other: "Other",
} as const;
export type MaintenanceCategory =
  (typeof MaintenanceCategory)[keyof typeof MaintenanceCategory];

export type ModificationDetail = {
  id: string;
  name: string;
  category: string;
  manufacturer: string | null;
  productName: string | null;
  installedAt: string;
  mileage: number;
  cost: number | null;
  notes: string | null;
};

export type MaintenanceRecordDetail = {
  id: string;
  title: string;
  category: MaintenanceCategory;
  date: string;
  mileage: number;
  cost: number | null;
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

export async function getGarageUnitSystem(userId: string): Promise<UnitSystem> {
  await connection();

  const { data: garage } = await supabase
    .from("Garage")
    .select("unitSystem")
    .eq("userId", userId)
    .order("createdAt", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (garage?.unitSystem as UnitSystem | undefined) ?? UnitSystem.Imperial;
}

type VehicleOverviewRow = {
  id: string;
  nickname: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  mileage: number;
  Modification: { count: number }[];
  MaintenanceRecord: { count: number }[];
};

export async function getGarageOverview(userId: string): Promise<GarageOverview> {
  await connection();

  const { data: garage } = await supabase
    .from("Garage")
    .select("id, unitSystem")
    .eq("userId", userId)
    .order("createdAt", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!garage) {
    return {
      stats: {
        totalVehicles: 0,
        totalModifications: 0,
        totalMaintenanceRecords: 0,
        oldestVehicleYear: null,
      } satisfies GarageStats,
      vehicles: [],
      unitSystem: UnitSystem.Imperial,
    };
  }

  const { data } = await supabase
    .from("Vehicle")
    .select(
      "id, nickname, year, make, model, trim, color, mileage, Modification(count), MaintenanceRecord(count)"
    )
    .eq("garageId", garage.id as string)
    .order("year", { ascending: true })
    .order("make", { ascending: true })
    .order("model", { ascending: true });

  const vehicleRows = (data ?? []) as unknown as VehicleOverviewRow[];

  const vehicles = vehicleRows.map((vehicle) => ({
    id: vehicle.id,
    nickname: vehicle.nickname,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    color: vehicle.color,
    mileage: vehicle.mileage,
    modificationCount: vehicle.Modification[0]?.count ?? 0,
    maintenanceRecordCount: vehicle.MaintenanceRecord[0]?.count ?? 0,
  })) satisfies VehicleListItem[];

  return {
    stats: {
      totalVehicles: vehicles.length,
      totalModifications: vehicles.reduce((sum, v) => sum + v.modificationCount, 0),
      totalMaintenanceRecords: vehicles.reduce(
        (sum, v) => sum + v.maintenanceRecordCount,
        0
      ),
      oldestVehicleYear: vehicles.length
        ? Math.min(...vehicles.map((v) => v.year))
        : null,
    } satisfies GarageStats,
    vehicles,
    unitSystem: garage.unitSystem as UnitSystem,
  };
}

type VehicleDetailRow = {
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
  Garage: { unitSystem: UnitSystem };
  Modification: {
    id: string;
    name: string;
    category: string;
    manufacturer: string | null;
    productName: string | null;
    installedAt: string;
    mileage: number;
    cost: number | null;
    notes: string | null;
  }[];
  MaintenanceRecord: {
    id: string;
    title: string;
    category: MaintenanceCategory;
    performedAt: string;
    mileage: number;
    cost: number | null;
    notes: string | null;
  }[];
};

export async function getVehicleById(id: string, userId: string) {
  await connection();

  const { data } = await supabase
    .from("Vehicle")
    .select(
      "*, Garage!inner(userId, unitSystem), Modification(*), MaintenanceRecord(*)"
    )
    .eq("id", id)
    .eq("Garage.userId", userId)
    .order("installedAt", { referencedTable: "Modification", ascending: false })
    .order("createdAt", { referencedTable: "Modification", ascending: false })
    .order("performedAt", { referencedTable: "MaintenanceRecord", ascending: false })
    .order("createdAt", { referencedTable: "MaintenanceRecord", ascending: false })
    .maybeSingle();

  if (!data) {
    return null;
  }

  const vehicle = data as unknown as VehicleDetailRow;

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
      purchasedAt: vehicle.purchasedAt
        ? new Date(vehicle.purchasedAt).toISOString().slice(0, 10)
        : null,
      purchasePrice: vehicle.purchasePrice,
      notes: vehicle.notes,
      modifications: vehicle.Modification.map((modification) => ({
        id: modification.id,
        name: modification.name,
        category: modification.category,
        manufacturer: modification.manufacturer,
        productName: modification.productName,
        installedAt: new Date(modification.installedAt).toISOString(),
        mileage: modification.mileage,
        cost: modification.cost,
        notes: modification.notes,
      })),
      maintenanceHistory: vehicle.MaintenanceRecord.map((record) => ({
        id: record.id,
        title: record.title,
        category: record.category,
        date: new Date(record.performedAt).toISOString(),
        mileage: record.mileage,
        cost: record.cost,
        notes: record.notes,
      })),
    } satisfies VehicleDetail,
    unitSystem: vehicle.Garage.unitSystem,
  };
}
