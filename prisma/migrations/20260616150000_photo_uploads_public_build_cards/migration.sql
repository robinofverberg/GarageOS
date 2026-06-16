ALTER TABLE "Vehicle"
ADD COLUMN "publicSlug" TEXT,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "featuredPhotoId" TEXT;

UPDATE "Vehicle"
SET "publicSlug" = "id"
WHERE "publicSlug" IS NULL;

ALTER TABLE "Vehicle"
ALTER COLUMN "publicSlug" SET NOT NULL;

CREATE UNIQUE INDEX "Vehicle_publicSlug_key" ON "Vehicle"("publicSlug");

CREATE TABLE "Photo" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "modificationId" TEXT,
  "maintenanceRecordId" TEXT,
  "url" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Photo_vehicleId_createdAt_idx" ON "Photo"("vehicleId", "createdAt" DESC);
CREATE INDEX "Photo_modificationId_idx" ON "Photo"("modificationId");
CREATE INDEX "Photo_maintenanceRecordId_idx" ON "Photo"("maintenanceRecordId");

ALTER TABLE "Photo"
ADD CONSTRAINT "Photo_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo"
ADD CONSTRAINT "Photo_modificationId_fkey"
FOREIGN KEY ("modificationId") REFERENCES "Modification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Photo"
ADD CONSTRAINT "Photo_maintenanceRecordId_fkey"
FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
