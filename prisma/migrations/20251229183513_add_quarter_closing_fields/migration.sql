-- AlterTable
ALTER TABLE "projection_paces" ADD COLUMN     "is_unfinished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "original_quarter" TEXT;

-- AlterTable
ALTER TABLE "quarters" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "closed_by" TEXT,
ADD COLUMN     "is_closed" BOOLEAN NOT NULL DEFAULT false;
