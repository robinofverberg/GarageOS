/**
 * @vitest-environment node
 */
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://garageos:garageos@localhost:5432/garageos_test?schema=public";

const suite = runDatabaseTests ? describe : describe.skip;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

suite("Prisma garage integration", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a user garage with vehicles and cascades deletes", async () => {
    const unique = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: `integration-${unique}@example.com`,
        passwordHash: "hash",
        garages: {
          create: {
            slug: `integration-${unique}`,
            name: "Integration Garage",
            vehicles: {
              create: {
                year: 1994,
                make: "Toyota",
                model: "Supra",
                mileage: 160934,
                modifications: {
                  create: {
                    name: "Coilovers",
                    category: "Suspension",
                    installedAt: new Date("2024-01-01T00:00:00.000Z"),
                  },
                },
                maintenanceRecords: {
                  create: {
                    title: "Oil service",
                    performedAt: new Date("2024-02-01T00:00:00.000Z"),
                    mileage: 160934,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        garages: {
          include: {
            vehicles: true,
          },
        },
      },
    });

    const vehicleId = user.garages[0].vehicles[0].id;

    await expect(
      prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { modifications: true, maintenanceRecords: true },
      })
    ).resolves.toMatchObject({
      make: "Toyota",
      modifications: [{ name: "Coilovers" }],
      maintenanceRecords: [{ title: "Oil service" }],
    });

    await prisma.user.delete({ where: { id: user.id } });

    await expect(prisma.vehicle.findUnique({ where: { id: vehicleId } })).resolves.toBeNull();
  });
});
