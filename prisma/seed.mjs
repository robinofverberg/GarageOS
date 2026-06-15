import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// PBKDF2 password hashing — same algorithm as src/lib/password.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 },
    key,
    256
  );
  const saltHex = Buffer.from(salt).toString("hex");
  const hashHex = Buffer.from(hash).toString("hex");
  return `${saltHex}:${hashHex}`;
}

const demoUser = {
  email: "demo@example.com",
  password: "demo1234",
  name: "Demo User",
};

const garageData = {
  name: "Demo Garage",
  description: "Demo GarageOS collection seeded for local development.",
  vehicles: [
    {
      year: 1993,
      make: "Toyota",
      model: "Supra",
      trim: "Turbo",
      color: "Super White",
      mileage: 87400,
      purchasedAt: new Date("2019-06-12"),
      notes: "JZA80 with original 2JZ-GTE. Numbers-matching.",
      modifications: [
        {
          name: "HKS GT2835 Turbo Kit",
          category: "Forced Induction",
          installedAt: new Date("2020-03-15"),
          notes: "Upgraded from stock CT12A twin-scroll. Tuned by RevSpeed.",
        },
        {
          name: "Tein Flex Z Coilovers",
          category: "Suspension",
          installedAt: new Date("2020-07-22"),
          notes: "Set at 15mm drop front, 10mm rear.",
        },
        {
          name: "Cusco Front Strut Bar",
          category: "Chassis",
          installedAt: new Date("2021-01-08"),
          notes: "Improves front-end rigidity noticeably.",
        },
      ],
      maintenanceRecords: [
        {
          title: "Oil & Filter Change",
          performedAt: new Date("2024-02-10"),
          mileage: 85200,
          notes: "Motul 300V 10W-40, OEM filter.",
        },
        {
          title: "Spark Plugs Replaced",
          performedAt: new Date("2023-09-05"),
          mileage: 83000,
          notes: "NGK BKR7E-11 iridium set.",
        },
        {
          title: "Coolant Flush",
          performedAt: new Date("2022-11-20"),
          mileage: 79500,
          notes: "Toyota pink LLC, full system flush.",
        },
      ],
    },
    {
      year: 2002,
      make: "Subaru",
      model: "Impreza WRX",
      trim: "STI",
      color: "World Rally Blue",
      mileage: 112000,
      purchasedAt: new Date("2021-04-03"),
      notes: "GDB chassis, version 7. Bought from original owner.",
      modifications: [
        {
          name: "Perrin Cold Air Intake",
          category: "Intake",
          installedAt: new Date("2021-08-14"),
          notes: "Slight top-end gain, much better induction noise.",
        },
        {
          name: "STI Pink Injectors",
          category: "Fueling",
          installedAt: new Date("2022-02-28"),
          notes: "565cc. Required ECU tune.",
        },
      ],
      maintenanceRecords: [
        {
          title: "Timing Belt & Water Pump",
          performedAt: new Date("2023-12-01"),
          mileage: 108000,
          notes: "Gates kit. Tensioners and idlers replaced at the same time.",
        },
        {
          title: "Brake Fluid Flush",
          performedAt: new Date("2024-01-18"),
          mileage: 110500,
          notes: "Motul RBF 660, ABS bleed included.",
        },
      ],
    },
    {
      year: 2008,
      make: "BMW",
      model: "M3",
      trim: "Base",
      color: "Interlagos Blue",
      mileage: 64200,
      purchasedAt: new Date("2022-09-30"),
      notes: "E92 coupe. One owner before me, dealer-serviced throughout.",
      modifications: [],
      maintenanceRecords: [
        {
          title: "Rod Bearing Replacement",
          performedAt: new Date("2023-03-22"),
          mileage: 60000,
          notes: "ACL Race bearings. Preventative measure on S65.",
        },
        {
          title: "Throttle Body Cleaning",
          performedAt: new Date("2024-04-05"),
          mileage: 63800,
          notes: "All 8 throttle bodies cleaned. Idle now smooth.",
        },
      ],
    },
  ],
};

async function main() {
  await prisma.modification.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.garage.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(demoUser.password);
  const user = await prisma.user.create({
    data: {
      email: demoUser.email,
      passwordHash,
      name: demoUser.name,
    },
  });

  await prisma.garage.create({
    data: {
      userId: user.id,
      slug: user.id,
      name: garageData.name,
      description: garageData.description,
      vehicles: {
        create: garageData.vehicles.map((vehicle) => ({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          color: vehicle.color,
          mileage: vehicle.mileage,
          purchasedAt: vehicle.purchasedAt,
          notes: vehicle.notes,
          modifications: {
            create: vehicle.modifications,
          },
          maintenanceRecords: {
            create: vehicle.maintenanceRecords,
          },
        })),
      },
    },
  });

  console.log(`\n✓ Seeded demo user: ${demoUser.email} / ${demoUser.password}\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
