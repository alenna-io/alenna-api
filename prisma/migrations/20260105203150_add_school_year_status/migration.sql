/*
  Warnings:

  - You are about to alter the column `name` on the `schools` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- CreateEnum
CREATE TYPE "SchoolYearStatus" AS ENUM ('CURRENT_YEAR', 'ARCHIVED');

-- AlterTable
ALTER TABLE "school_years" ADD COLUMN     "status" "SchoolYearStatus" NOT NULL DEFAULT 'CURRENT_YEAR';

-- AlterTable
ALTER TABLE "schools" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);
