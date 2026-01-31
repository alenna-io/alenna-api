/*
  Warnings:

  - A unique constraint covering the columns `[school_year_id,quarter,name,month]` on the table `monthly_assignment_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."monthly_assignment_templates_school_year_id_quarter_name_key";

-- AlterTable
ALTER TABLE "monthly_assignment_templates" ADD COLUMN     "month" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "monthly_assignment_templates_school_year_id_quarter_name_mo_key" ON "monthly_assignment_templates"("school_year_id", "quarter", "name", "month");
