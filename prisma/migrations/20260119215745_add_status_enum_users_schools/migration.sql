/*
  Warnings:

  - You are about to drop the column `is_active` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- DropIndex
DROP INDEX "public"."users_is_active_idx";

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "is_active",
ADD COLUMN     "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_active",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
