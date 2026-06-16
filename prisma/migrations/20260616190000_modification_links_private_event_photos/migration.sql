ALTER TABLE "Modification"
ADD COLUMN "productUrl" TEXT;

ALTER TABLE "Photo"
ADD COLUMN "isGallery" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Photo"
SET "isGallery" = true
WHERE "modificationId" IS NULL
  AND "maintenanceRecordId" IS NULL;
