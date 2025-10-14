-- CreateTable: certification_types
CREATE TABLE "certification_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "certification_types_schoolId_idx" ON "certification_types"("schoolId");

-- CreateIndex (Unique certification name per school)
CREATE UNIQUE INDEX "certification_types_schoolId_name_key" ON "certification_types"("schoolId", "name");

-- AddForeignKey
ALTER TABLE "certification_types" ADD CONSTRAINT "certification_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 1: Create certification types for each school based on existing student data
INSERT INTO "certification_types" ("id", "name", "schoolId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    s."certificationType",
    s."schoolId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "students" s
GROUP BY s."certificationType", s."schoolId";

-- Step 2: Add nullable certificationTypeId column to students
ALTER TABLE "students" ADD COLUMN "certificationTypeId" TEXT;

-- Step 3: Populate certificationTypeId by matching existing certificationType strings
UPDATE "students" s
SET "certificationTypeId" = ct.id
FROM "certification_types" ct
WHERE s."schoolId" = ct."schoolId" 
  AND s."certificationType" = ct.name;

-- Step 4: Make certificationTypeId required
ALTER TABLE "students" ALTER COLUMN "certificationTypeId" SET NOT NULL;

-- Step 5: Create index on certificationTypeId
CREATE INDEX "students_certificationTypeId_idx" ON "students"("certificationTypeId");

-- Step 6: Add foreign key constraint
ALTER TABLE "students" ADD CONSTRAINT "students_certificationTypeId_fkey" FOREIGN KEY ("certificationTypeId") REFERENCES "certification_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Drop old certificationType column
ALTER TABLE "students" DROP COLUMN "certificationType";

