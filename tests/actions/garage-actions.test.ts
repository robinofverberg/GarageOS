import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnitSystem } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  garageFindFirst: vi.fn(),
  garageFindUnique: vi.fn(),
  garageCreate: vi.fn(),
  garageUpdate: vi.fn(),
  vehicleCreate: vi.fn(),
  vehicleFindFirst: vi.fn(),
  maintenanceRecordCreate: vi.fn(),
  maintenanceRecordFindFirst: vi.fn(),
  maintenanceRecordUpdate: vi.fn(),
  maintenanceRecordDelete: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/session", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    garage: {
      findFirst: mocks.garageFindFirst,
      findUnique: mocks.garageFindUnique,
      create: mocks.garageCreate,
      update: mocks.garageUpdate,
    },
    vehicle: {
      create: mocks.vehicleCreate,
      findFirst: mocks.vehicleFindFirst,
    },
    maintenanceRecord: {
      create: mocks.maintenanceRecordCreate,
      findFirst: mocks.maintenanceRecordFindFirst,
      update: mocks.maintenanceRecordUpdate,
      delete: mocks.maintenanceRecordDelete,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

const { createMaintenanceRecord, deleteMaintenanceRecord, createVehicle, updateGarageUnitSystem } =
  await import("@/app/garage/actions");

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

const vehicleForm = form({
  nickname: "Track car",
  registrationNumber: "ABC123",
  year: "1994",
  make: "Toyota",
  model: "Supra",
  trim: "Turbo",
  bodyType: "Coupe",
  color: "White",
  engine: "2JZ-GTE",
  transmission: "6-speed manual",
  fuelType: "Petrol",
  horsepower: "320",
  torque: "440",
  mileage: "100000",
  purchasedAt: "2024-01-15",
  purchasePrice: "45000",
  notes: "Fresh import",
});

describe("garage server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ sub: "user_1", email: "driver@example.com", name: null });
  });

  it("rejects invalid unit system updates", async () => {
    await expect(updateGarageUnitSystem(form({ unitSystem: "Kelvin" }))).rejects.toThrow(
      "Invalid unit system."
    );
    expect(mocks.garageUpdate).not.toHaveBeenCalled();
  });

  it("updates the primary garage unit system", async () => {
    mocks.garageFindFirst.mockResolvedValue({ id: "garage_1" });

    await updateGarageUnitSystem(form({ unitSystem: "Metric" }));

    expect(mocks.garageUpdate).toHaveBeenCalledWith({
      where: { id: "garage_1" },
      data: { unitSystem: UnitSystem.Metric },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/garage");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/vehicle");
  });

  it("creates a primary garage when creating the first vehicle", async () => {
    mocks.garageFindFirst.mockResolvedValue(null);
    mocks.garageCreate.mockResolvedValue({ id: "garage_1" });
    mocks.garageFindUnique.mockResolvedValue({ unitSystem: UnitSystem.Imperial });
    mocks.vehicleCreate.mockResolvedValue({ id: "vehicle_1" });

    await expect(createVehicle(vehicleForm)).rejects.toThrow("NEXT_REDIRECT:/vehicle/vehicle_1");

    expect(mocks.garageCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        slug: "user_1",
        name: "My Garage",
        description: "My GarageOS garage.",
      },
      select: { id: true },
    });
    expect(mocks.vehicleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        garageId: "garage_1",
        make: "Toyota",
        model: "Supra",
        mileage: 160934,
      }),
    });
  });

  it("creates maintenance records with category, mileage, and cost", async () => {
    mocks.vehicleFindFirst.mockResolvedValue({
      id: "vehicle_1",
      garage: { unitSystem: UnitSystem.Imperial },
    });
    mocks.maintenanceRecordCreate.mockResolvedValue({ id: "record_1" });

    await expect(
      createMaintenanceRecord(
        "vehicle_1",
        form({
          title: "Annual inspection",
          category: "Inspection",
          performedAt: "2026-01-15",
          mileage: "100000",
          cost: "129.99",
          notes: "Passed without remarks.",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/vehicle/vehicle_1");

    expect(mocks.maintenanceRecordCreate).toHaveBeenCalledWith({
      data: {
        vehicleId: "vehicle_1",
        title: "Annual inspection",
        category: "Inspection",
        performedAt: new Date("2026-01-15"),
        mileage: 160934,
        cost: 129.99,
        notes: "Passed without remarks.",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/garage");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/vehicle/vehicle_1");
  });

  it("rejects invalid maintenance categories", async () => {
    mocks.vehicleFindFirst.mockResolvedValue({
      id: "vehicle_1",
      garage: { unitSystem: UnitSystem.Metric },
    });

    await expect(
      createMaintenanceRecord(
        "vehicle_1",
        form({
          title: "Suspicious entry",
          category: "Warranty",
          performedAt: "2026-01-15",
          mileage: "100000",
          cost: "",
          notes: "",
        })
      )
    ).rejects.toThrow("Invalid maintenance category: Warranty");

    expect(mocks.maintenanceRecordCreate).not.toHaveBeenCalled();
  });

  it("refuses to delete another user's maintenance record", async () => {
    mocks.maintenanceRecordFindFirst.mockResolvedValue(null);

    await expect(deleteMaintenanceRecord("record_1")).rejects.toThrow(
      "Maintenance record not found."
    );
    expect(mocks.maintenanceRecordDelete).not.toHaveBeenCalled();
  });
});
