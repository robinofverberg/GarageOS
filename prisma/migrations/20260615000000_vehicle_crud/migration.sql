-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('Sedan', 'Wagon', 'Coupe', 'Cabriolet', 'Hatchback', 'SUV', 'Van', 'Pickup', 'Motorcycle', 'Other');

-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('Metric', 'Imperial');

-- AlterTable
ALTER TABLE "Garage" ADD COLUMN "unitSystem" "UnitSystem" NOT NULL DEFAULT 'Imperial';

-- AlterTable
ALTER TABLE "Vehicle"
    ADD COLUMN "nickname" TEXT,
    ADD COLUMN "registrationNumber" TEXT,
    ADD COLUMN "bodyType" "BodyType",
    ADD COLUMN "engine" TEXT,
    ADD COLUMN "transmission" TEXT,
    ADD COLUMN "fuelType" TEXT,
    ADD COLUMN "horsepower" INTEGER,
    ADD COLUMN "torque" INTEGER,
    ADD COLUMN "purchasePrice" DOUBLE PRECISION;
