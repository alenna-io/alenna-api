-- CreateEnum
CREATE TYPE "ProjectionStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "projections" ADD COLUMN     "status" "ProjectionStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "projections_studentId_schoolYear_status_idx" ON "projections"("studentId", "schoolYear", "status");
