export type Modification = {
  id: string;
  name: string;
  category: string;
  installedAt: string;
  notes: string;
};

export type MaintenanceRecord = {
  id: string;
  title: string;
  date: string;
  mileage: number;
  notes: string;
};

export type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  color: string;
  mileage: number;
  purchasedAt: string;
  notes: string;
  modifications: Modification[];
  maintenanceHistory: MaintenanceRecord[];
};

export type GarageStats = {
  totalVehicles: number;
  totalModifications: number;
  totalMaintenanceRecords: number;
  oldestVehicleYear: number;
};

export const vehicles: Vehicle[] = [
  {
    id: "1",
    year: 1993,
    make: "Toyota",
    model: "Supra",
    trim: "Turbo",
    color: "Super White",
    mileage: 87_400,
    purchasedAt: "2019-06-12",
    notes: "JZA80 with original 2JZ-GTE. Numbers-matching.",
    modifications: [
      {
        id: "m1",
        name: "HKS GT2835 Turbo Kit",
        category: "Forced Induction",
        installedAt: "2020-03-15",
        notes: "Upgraded from stock CT12A twin-scroll. Tuned by RevSpeed.",
      },
      {
        id: "m2",
        name: "Tein Flex Z Coilovers",
        category: "Suspension",
        installedAt: "2020-07-22",
        notes: "Set at 15mm drop front, 10mm rear.",
      },
      {
        id: "m3",
        name: "Cusco Front Strut Bar",
        category: "Chassis",
        installedAt: "2021-01-08",
        notes: "Improves front-end rigidity noticeably.",
      },
    ],
    maintenanceHistory: [
      {
        id: "r1",
        title: "Oil & Filter Change",
        date: "2024-02-10",
        mileage: 85_200,
        notes: "Motul 300V 10W-40, OEM filter.",
      },
      {
        id: "r2",
        title: "Spark Plugs Replaced",
        date: "2023-09-05",
        mileage: 83_000,
        notes: "NGK BKR7E-11 iridium set.",
      },
      {
        id: "r3",
        title: "Coolant Flush",
        date: "2022-11-20",
        mileage: 79_500,
        notes: "Toyota pink LLC, full system flush.",
      },
    ],
  },
  {
    id: "2",
    year: 2002,
    make: "Subaru",
    model: "Impreza WRX",
    trim: "STI",
    color: "World Rally Blue",
    mileage: 112_000,
    purchasedAt: "2021-04-03",
    notes: "GDB chassis, version 7. Bought from original owner.",
    modifications: [
      {
        id: "m4",
        name: "Perrin Cold Air Intake",
        category: "Intake",
        installedAt: "2021-08-14",
        notes: "Slight top-end gain, much better induction noise.",
      },
      {
        id: "m5",
        name: "STI Pink Injectors",
        category: "Fueling",
        installedAt: "2022-02-28",
        notes: "565cc. Required ECU tune.",
      },
    ],
    maintenanceHistory: [
      {
        id: "r4",
        title: "Timing Belt & Water Pump",
        date: "2023-12-01",
        mileage: 108_000,
        notes: "Gates kit. Tensioners and idlers replaced at the same time.",
      },
      {
        id: "r5",
        title: "Brake Fluid Flush",
        date: "2024-01-18",
        mileage: 110_500,
        notes: "Motul RBF 660, ABS bleed included.",
      },
    ],
  },
  {
    id: "3",
    year: 2008,
    make: "BMW",
    model: "M3",
    trim: "Base",
    color: "Interlagos Blue",
    mileage: 64_200,
    purchasedAt: "2022-09-30",
    notes: "E92 coupe. One owner before me, dealer-serviced throughout.",
    modifications: [],
    maintenanceHistory: [
      {
        id: "r6",
        title: "Rod Bearing Replacement",
        date: "2023-03-22",
        mileage: 60_000,
        notes: "ACL Race bearings. Preventative measure on S65.",
      },
      {
        id: "r7",
        title: "Throttle Body Cleaning",
        date: "2024-04-05",
        mileage: 63_800,
        notes: "All 8 throttle bodies cleaned. Idle now smooth.",
      },
    ],
  },
];

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((v) => v.id === id);
}

export function getGarageStats(): GarageStats {
  const totalModifications = vehicles.reduce(
    (sum, v) => sum + v.modifications.length,
    0
  );
  const totalMaintenanceRecords = vehicles.reduce(
    (sum, v) => sum + v.maintenanceHistory.length,
    0
  );
  const oldestVehicleYear = Math.min(...vehicles.map((v) => v.year));
  return {
    totalVehicles: vehicles.length,
    totalModifications,
    totalMaintenanceRecords,
    oldestVehicleYear,
  };
}
