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
  productUrl: string | null;
  installedAt: string;
  mileage: number;
  cost: number | null;
  notes: string | null;
  photos: PhotoDetail[];
};

export type MaintenanceRecordDetail = {
  id: string;
  title: string;
  category: MaintenanceCategory;
  date: string;
  mileage: number;
  cost: number | null;
  notes: string | null;
  photos: PhotoDetail[];
};

export type PhotoDetail = {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  caption: string | null;
  modificationId: string | null;
  maintenanceRecordId: string | null;
  isGallery: boolean;
  createdAt: string;
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
  featuredPhoto: PhotoDetail | null;
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
  publicSlug: string;
  isPublic: boolean;
  featuredPhotoId: string | null;
  photos: PhotoDetail[];
  modifications: ModificationDetail[];
  maintenanceHistory: MaintenanceRecordDetail[];
};

export type PublicBuildCard = VehicleDetail & {
  garageName: string;
  featuredPhoto: PhotoDetail | null;
  totalBuildCost: number;
  totalModificationCost: number;
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

type PhotoRow = {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  caption: string | null;
  modificationId: string | null;
  maintenanceRecordId: string | null;
  isGallery: boolean;
  createdAt: string;
};

const PHOTO_COLUMNS =
  "id, url, fileName, contentType, size, caption, modificationId, maintenanceRecordId, isGallery, createdAt";

function mapPhoto(photo: PhotoRow): PhotoDetail {
  return {
    id: photo.id,
    url: photo.url,
    fileName: photo.fileName,
    contentType: photo.contentType,
    size: photo.size,
    caption: photo.caption,
    modificationId: photo.modificationId,
    maintenanceRecordId: photo.maintenanceRecordId,
    isGallery: photo.isGallery,
    createdAt: new Date(photo.createdAt).toISOString(),
  };
}

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
  featuredPhotoId: string | null;
  Modification: { count: number }[];
  MaintenanceRecord: { count: number }[];
  Photo: PhotoRow[];
};

/** Picks the featured gallery photo, falling back to the most recent one. */
function pickFeaturedPhoto(
  photos: PhotoRow[],
  featuredPhotoId: string | null
): PhotoDetail | null {
  const gallery = photos.filter((photo) => photo.isGallery);
  const featured =
    gallery.find((photo) => photo.id === featuredPhotoId) ?? gallery[0] ?? null;
  return featured ? mapPhoto(featured) : null;
}

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
      `id, nickname, year, make, model, trim, color, mileage, featuredPhotoId, Modification(count), MaintenanceRecord(count), Photo(${PHOTO_COLUMNS})`
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
    featuredPhoto: pickFeaturedPhoto(vehicle.Photo ?? [], vehicle.featuredPhotoId),
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

type ModificationRow = {
  id: string;
  name: string;
  category: string;
  manufacturer: string | null;
  productName: string | null;
  productUrl: string | null;
  installedAt: string;
  mileage: number;
  cost: number | null;
  notes: string | null;
  Photo: PhotoRow[];
};

type MaintenanceRecordRow = {
  id: string;
  title: string;
  category: MaintenanceCategory;
  performedAt: string;
  mileage: number;
  cost: number | null;
  notes: string | null;
  Photo: PhotoRow[];
};

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
  publicSlug: string;
  isPublic: boolean;
  featuredPhotoId: string | null;
  Garage: { unitSystem: UnitSystem };
  Photo: PhotoRow[];
  Modification: ModificationRow[];
  MaintenanceRecord: MaintenanceRecordRow[];
};

function mapModification(modification: ModificationRow): ModificationDetail {
  return {
    id: modification.id,
    name: modification.name,
    category: modification.category,
    manufacturer: modification.manufacturer,
    productName: modification.productName,
    productUrl: modification.productUrl,
    installedAt: new Date(modification.installedAt).toISOString(),
    mileage: modification.mileage,
    cost: modification.cost,
    notes: modification.notes,
    photos: (modification.Photo ?? []).map(mapPhoto),
  };
}

function mapMaintenanceRecord(record: MaintenanceRecordRow): MaintenanceRecordDetail {
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    date: new Date(record.performedAt).toISOString(),
    mileage: record.mileage,
    cost: record.cost,
    notes: record.notes,
    photos: (record.Photo ?? []).map(mapPhoto),
  };
}

const VEHICLE_DETAIL_SELECT = `*, Garage!inner(userId, unitSystem), Photo(${PHOTO_COLUMNS}), Modification(*, Photo(${PHOTO_COLUMNS})), MaintenanceRecord(*, Photo(${PHOTO_COLUMNS}))`;

export async function getVehicleById(id: string, userId: string) {
  await connection();

  const { data } = await supabase
    .from("Vehicle")
    .select(VEHICLE_DETAIL_SELECT)
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
      publicSlug: vehicle.publicSlug,
      isPublic: vehicle.isPublic,
      featuredPhotoId: vehicle.featuredPhotoId,
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
      photos: (vehicle.Photo ?? []).filter((photo) => photo.isGallery).map(mapPhoto),
      modifications: (vehicle.Modification ?? []).map(mapModification),
      maintenanceHistory: (vehicle.MaintenanceRecord ?? []).map(mapMaintenanceRecord),
    } satisfies VehicleDetail,
    unitSystem: vehicle.Garage.unitSystem,
  };
}

type PublicBuildRow = VehicleDetailRow & {
  Garage: { name: string; unitSystem: UnitSystem };
};

export async function getPublicBuildCard(publicSlug: string) {
  await connection();

  const { data } = await supabase
    .from("Vehicle")
    .select(
      `*, Garage!inner(name, unitSystem), Photo(${PHOTO_COLUMNS}), Modification(*, Photo(${PHOTO_COLUMNS})), MaintenanceRecord(*, Photo(${PHOTO_COLUMNS}))`
    )
    .eq("publicSlug", publicSlug)
    .eq("isPublic", true)
    .order("installedAt", { referencedTable: "Modification", ascending: false })
    .order("createdAt", { referencedTable: "Modification", ascending: false })
    .order("performedAt", { referencedTable: "MaintenanceRecord", ascending: false })
    .order("createdAt", { referencedTable: "MaintenanceRecord", ascending: false })
    .maybeSingle();

  if (!data) {
    return null;
  }

  const vehicle = data as unknown as PublicBuildRow;

  const photos = (vehicle.Photo ?? []).filter((photo) => photo.isGallery).map(mapPhoto);
  const featuredPhoto =
    photos.find((photo) => photo.id === vehicle.featuredPhotoId) ?? photos[0] ?? null;
  const modifications = (vehicle.Modification ?? []).map(mapModification);
  const maintenanceHistory = (vehicle.MaintenanceRecord ?? []).map(mapMaintenanceRecord);
  const totalModificationCost = modifications.reduce(
    (sum, modification) => sum + (modification.cost ?? 0),
    0
  );
  const buildCard = {
    id: vehicle.id,
    nickname: vehicle.nickname,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    registrationNumber: null,
    publicSlug: vehicle.publicSlug,
    isPublic: vehicle.isPublic,
    featuredPhotoId: vehicle.featuredPhotoId,
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
    photos,
    modifications,
    maintenanceHistory,
    garageName: vehicle.Garage.name,
    featuredPhoto,
    totalBuildCost: (vehicle.purchasePrice ?? 0) + totalModificationCost,
    totalModificationCost,
  } satisfies PublicBuildCard;

  return {
    vehicle: buildCard,
    unitSystem: vehicle.Garage.unitSystem,
  };
}

