CREATE TYPE "MaintenanceCategory" AS ENUM ('Service', 'Inspection', 'Repair', 'Modification', 'Tires', 'Fluids', 'Other');

ALTER TABLE "MaintenanceRecord"
ADD COLUMN "category" "MaintenanceCategory" NOT NULL DEFAULT 'Service',
ADD COLUMN "cost" DOUBLE PRECISION;
