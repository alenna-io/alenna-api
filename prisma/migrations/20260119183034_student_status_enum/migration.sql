/*
  Warnings:

  - You are about to drop the column `sub_subject_id` on the `pace_catalog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subject_id,code]` on the table `pace_catalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subject_id,order_index]` on the table `pace_catalog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subject_id` to the `pace_catalog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ENROLLED', 'ON_TRACK', 'BEHIND_SCHEDULE', 'AHEAD_OF_SCHEDULE', 'GRADUATED', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "public"."pace_catalog" DROP CONSTRAINT "pace_catalog_sub_subject_id_fkey";

-- DropIndex
DROP INDEX "public"."pace_catalog_sub_subject_id_code_key";

-- DropIndex
DROP INDEX "public"."pace_catalog_sub_subject_id_idx";

-- DropIndex
DROP INDEX "public"."pace_catalog_sub_subject_id_order_index_key";

-- AlterTable
ALTER TABLE "pace_catalog" DROP COLUMN "sub_subject_id",
ADD COLUMN     "subject_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "pace_catalog_subject_id_idx" ON "pace_catalog"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "pace_catalog_subject_id_code_key" ON "pace_catalog"("subject_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "pace_catalog_subject_id_order_index_key" ON "pace_catalog"("subject_id", "order_index");

-- AddForeignKey
ALTER TABLE "pace_catalog" ADD CONSTRAINT "pace_catalog_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
