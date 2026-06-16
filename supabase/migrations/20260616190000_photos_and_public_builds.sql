-- Vehicle: public build sharing + featured photo
ALTER TABLE "Vehicle"
    ADD COLUMN "publicSlug" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "featuredPhotoId" TEXT;

CREATE UNIQUE INDEX "Vehicle_publicSlug_key" ON "Vehicle"("publicSlug");

-- Modification: optional product link
ALTER TABLE "Modification"
    ADD COLUMN "productUrl" TEXT;

-- Photo: gallery + event attachments
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
    "isGallery" BOOLEAN NOT NULL DEFAULT false,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Photo_vehicleId_createdAt_idx" ON "Photo"("vehicleId", "createdAt" DESC);
CREATE INDEX "Photo_modificationId_idx" ON "Photo"("modificationId");
CREATE INDEX "Photo_maintenanceRecordId_idx" ON "Photo"("maintenanceRecordId");

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_modificationId_fkey" FOREIGN KEY ("modificationId") REFERENCES "Modification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Public storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;
