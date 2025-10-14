-- CreateTable: projections
CREATE TABLE "projections" (
    "id" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projections_studentId_idx" ON "projections"("studentId");

-- CreateIndex
CREATE INDEX "projections_studentId_isActive_idx" ON "projections"("studentId", "isActive");

-- AddForeignKey
ALTER TABLE "projections" ADD CONSTRAINT "projections_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default projection for each existing student (2024-2025 school year)
INSERT INTO "projections" ("id", "schoolYear", "startDate", "endDate", "isActive", "studentId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    '2024-2025',
    '2024-08-01'::timestamp,
    '2025-06-30'::timestamp,
    true,
    id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "students";

-- Add nullable projectionId column to paces
ALTER TABLE "paces" ADD COLUMN "projectionId" TEXT;

-- Add nullable projectionId column to daily_goals  
ALTER TABLE "daily_goals" ADD COLUMN "projectionId" TEXT;

-- Populate projectionId in paces table using student's active projection
UPDATE "paces" p
SET "projectionId" = proj.id
FROM "projections" proj
WHERE p."studentId" = proj."studentId" 
  AND proj."isActive" = true;

-- Populate projectionId in daily_goals table using student's active projection
UPDATE "daily_goals" dg
SET "projectionId" = proj.id
FROM "projections" proj
WHERE dg."studentId" = proj."studentId" 
  AND proj."isActive" = true;

-- Make projectionId required in paces
ALTER TABLE "paces" ALTER COLUMN "projectionId" SET NOT NULL;

-- Make projectionId required in daily_goals
ALTER TABLE "daily_goals" ALTER COLUMN "projectionId" SET NOT NULL;

-- Add comments column to paces
ALTER TABLE "paces" ADD COLUMN "comments" TEXT;

-- Create indexes for new projectionId columns
CREATE INDEX "paces_projectionId_idx" ON "paces"("projectionId");
CREATE INDEX "paces_projectionId_quarter_week_idx" ON "paces"("projectionId", "quarter", "week");

CREATE INDEX "daily_goals_projectionId_idx" ON "daily_goals"("projectionId");
CREATE INDEX "daily_goals_projectionId_quarter_week_idx" ON "daily_goals"("projectionId", "quarter", "week");

-- Add foreign key constraints
ALTER TABLE "paces" ADD CONSTRAINT "paces_projectionId_fkey" FOREIGN KEY ("projectionId") REFERENCES "projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_goals" ADD CONSTRAINT "daily_goals_projectionId_fkey" FOREIGN KEY ("projectionId") REFERENCES "projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old indexes and foreign keys
DROP INDEX IF EXISTS "paces_studentId_idx";
DROP INDEX IF EXISTS "paces_studentId_quarter_week_idx";
DROP INDEX IF EXISTS "daily_goals_studentId_idx";
DROP INDEX IF EXISTS "daily_goals_studentId_quarter_week_idx";

ALTER TABLE "paces" DROP CONSTRAINT IF EXISTS "paces_studentId_fkey";
ALTER TABLE "daily_goals" DROP CONSTRAINT IF EXISTS "daily_goals_studentId_fkey";

-- Drop old studentId columns
ALTER TABLE "paces" DROP COLUMN "studentId";
ALTER TABLE "daily_goals" DROP COLUMN "studentId";

