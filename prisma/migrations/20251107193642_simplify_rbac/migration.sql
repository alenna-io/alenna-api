/*
  Warnings:

  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_modules` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[key]` on the table `modules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `modules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."permissions" DROP CONSTRAINT "permissions_module_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_modules" DROP CONSTRAINT "user_modules_module_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_modules" DROP CONSTRAINT "user_modules_user_id_fkey";

-- DropIndex
DROP INDEX "public"."modules_name_key";

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "key" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."permissions";

-- DropTable
DROP TABLE "public"."role_permissions";

-- DropTable
DROP TABLE "public"."user_modules";

-- CreateTable
CREATE TABLE "roles_modules_school" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_modules_school_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_modules_school_role_id_idx" ON "roles_modules_school"("role_id");

-- CreateIndex
CREATE INDEX "roles_modules_school_school_id_idx" ON "roles_modules_school"("school_id");

-- CreateIndex
CREATE INDEX "roles_modules_school_module_id_idx" ON "roles_modules_school"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_modules_school_role_id_school_id_module_id_key" ON "roles_modules_school"("role_id", "school_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "modules_key_key" ON "modules"("key");

-- AddForeignKey
ALTER TABLE "roles_modules_school" ADD CONSTRAINT "roles_modules_school_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_modules_school" ADD CONSTRAINT "roles_modules_school_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_modules_school" ADD CONSTRAINT "roles_modules_school_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
