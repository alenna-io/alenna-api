/*
  Warnings:

  - Made the column `schoolId` on table `projections` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "projections" ALTER COLUMN "schoolId" SET NOT NULL;
