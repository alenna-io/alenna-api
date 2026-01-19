/*
  Warnings:

  - Made the column `order_index` on table `pace_catalog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "pace_catalog" ALTER COLUMN "order_index" SET NOT NULL,
ALTER COLUMN "order_index" DROP DEFAULT;
