/*
  Warnings:

  - A unique constraint covering the columns `[sub_subject_id,order_index]` on the table `pace_catalog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "QuarterStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "pace_catalog" ADD COLUMN     "order_index" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "quarters" ADD COLUMN     "status" "QuarterStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "pace_catalog_order_index_idx" ON "pace_catalog"("order_index");

-- CreateIndex
CREATE UNIQUE INDEX "pace_catalog_sub_subject_id_order_index_key" ON "pace_catalog"("sub_subject_id", "order_index");
