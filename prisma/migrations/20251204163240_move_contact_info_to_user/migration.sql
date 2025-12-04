/*
  Warnings:

  - You are about to drop the column `address` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `contact_phone` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `street_address` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "contact_phone",
DROP COLUMN "country",
DROP COLUMN "state",
DROP COLUMN "street_address",
DROP COLUMN "zip_code";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street_address" TEXT,
ADD COLUMN     "zip_code" TEXT;
