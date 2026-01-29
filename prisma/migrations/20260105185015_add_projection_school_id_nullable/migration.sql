-- CreateEnum
CREATE TYPE "ProjectionPaceStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'UNFINISHED');

-- AlterTable
ALTER TABLE "projection_paces" ADD COLUMN     "status" "ProjectionPaceStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "projections" ADD COLUMN     "schoolId" TEXT;

-- CreateIndex
CREATE INDEX "projection_paces_projection_id_status_idx" ON "projection_paces"("projection_id", "status");
