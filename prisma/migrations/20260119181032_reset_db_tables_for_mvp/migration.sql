/*
  Warnings:

  - You are about to drop the column `comments` on the `projection_paces` table. All the data in the column will be lost.
  - You are about to drop the column `is_completed` on the `projection_paces` table. All the data in the column will be lost.
  - You are about to drop the column `is_failed` on the `projection_paces` table. All the data in the column will be lost.
  - You are about to drop the column `is_unfinished` on the `projection_paces` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `projections` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `projections` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `projections` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `projections` table. All the data in the column will be lost.
  - You are about to drop the column `display_name` on the `quarters` table. All the data in the column will be lost.
  - You are about to drop the column `is_closed` on the `quarters` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `school_years` table. All the data in the column will be lost.
  - You are about to drop the column `birth_date` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `certification_type_id` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `current_level` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `expected_level` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `graduation_date` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `is_leveled` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `students` table. All the data in the column will be lost.
  - You are about to drop the `billing_payment_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `billing_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `certification_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `character_traits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monthly_assignment_grade_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monthly_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projection_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projection_template_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projection_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quarter_grade_percentages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quarter_holidays` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recurring_extra_charges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles_modules_school` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_monthly_assignment_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_billing_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_scholarships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `taxable_invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tuition_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tuition_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_students` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."billing_payment_transactions" DROP CONSTRAINT "billing_payment_transactions_billing_record_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_records" DROP CONSTRAINT "billing_records_school_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_records" DROP CONSTRAINT "billing_records_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."certification_types" DROP CONSTRAINT "certification_types_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."character_traits" DROP CONSTRAINT "character_traits_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."character_traits" DROP CONSTRAINT "character_traits_school_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."group_students" DROP CONSTRAINT "group_students_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."group_students" DROP CONSTRAINT "group_students_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."groups" DROP CONSTRAINT "groups_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."groups" DROP CONSTRAINT "groups_school_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."groups" DROP CONSTRAINT "groups_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."monthly_assignment_grade_history" DROP CONSTRAINT "monthly_assignment_grade_history_monthly_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."monthly_assignments" DROP CONSTRAINT "monthly_assignments_projection_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."projection_categories" DROP CONSTRAINT "projection_categories_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."projection_categories" DROP CONSTRAINT "projection_categories_projection_id_fkey";

-- DropForeignKey (conditional - constraint may not exist if table was already modified)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'projection_template_subjects' 
        AND constraint_name = 'projection_template_subjects_sub_subject_id_fkey'
    ) THEN
        ALTER TABLE "public"."projection_template_subjects" DROP CONSTRAINT "projection_template_subjects_sub_subject_id_fkey";
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'projection_template_subjects' 
        AND constraint_name = 'projection_template_subjects_template_id_fkey'
    ) THEN
        ALTER TABLE "public"."projection_template_subjects" DROP CONSTRAINT "projection_template_subjects_template_id_fkey";
    END IF;
END $$;

-- DropForeignKey
ALTER TABLE "public"."projection_templates" DROP CONSTRAINT "projection_templates_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."quarter_grade_percentages" DROP CONSTRAINT "quarter_grade_percentages_school_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."quarter_holidays" DROP CONSTRAINT "quarter_holidays_quarter_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."quarter_holidays" DROP CONSTRAINT "quarter_holidays_school_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recurring_extra_charges" DROP CONSTRAINT "recurring_extra_charges_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."roles" DROP CONSTRAINT "roles_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."roles_modules_school" DROP CONSTRAINT "roles_modules_school_module_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."roles_modules_school" DROP CONSTRAINT "roles_modules_school_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."roles_modules_school" DROP CONSTRAINT "roles_modules_school_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_modules" DROP CONSTRAINT "school_modules_module_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_modules" DROP CONSTRAINT "school_modules_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_monthly_assignment_templates" DROP CONSTRAINT "school_monthly_assignment_templates_school_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_billing_configs" DROP CONSTRAINT "student_billing_configs_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_scholarships" DROP CONSTRAINT "student_scholarships_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_scholarships" DROP CONSTRAINT "student_scholarships_tuition_type_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."students" DROP CONSTRAINT "students_certification_type_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."taxable_invoices" DROP CONSTRAINT "taxable_invoices_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_students" DROP CONSTRAINT "teacher_students_school_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_students" DROP CONSTRAINT "teacher_students_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_students" DROP CONSTRAINT "teacher_students_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tuition_configs" DROP CONSTRAINT "tuition_configs_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tuition_types" DROP CONSTRAINT "tuition_types_school_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_students" DROP CONSTRAINT "user_students_student_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_students" DROP CONSTRAINT "user_students_user_id_fkey";

-- DropIndex
DROP INDEX "public"."projections_studentId_isActive_idx";

-- DropIndex
DROP INDEX "public"."school_years_school_id_is_active_idx";

-- DropIndex
DROP INDEX "public"."students_certification_type_id_idx";

-- AlterTable
ALTER TABLE "projection_paces" DROP COLUMN "comments",
DROP COLUMN "is_completed",
DROP COLUMN "is_failed",
DROP COLUMN "is_unfinished";

-- AlterTable
ALTER TABLE "projections" DROP COLUMN "endDate",
DROP COLUMN "isActive",
DROP COLUMN "notes",
DROP COLUMN "startDate";

-- AlterTable
ALTER TABLE "quarters" DROP COLUMN "display_name",
DROP COLUMN "is_closed";

-- AlterTable
ALTER TABLE "school_years" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "birth_date",
DROP COLUMN "certification_type_id",
DROP COLUMN "current_level",
DROP COLUMN "expected_level",
DROP COLUMN "graduation_date",
DROP COLUMN "is_leveled",
DROP COLUMN "status";

-- DropTable
DROP TABLE "public"."billing_payment_transactions";

-- DropTable
DROP TABLE "public"."billing_records";

-- DropTable
DROP TABLE "public"."certification_types";

-- DropTable
DROP TABLE "public"."character_traits";

-- DropTable
DROP TABLE "public"."group_students";

-- DropTable
DROP TABLE "public"."groups";

-- DropTable
DROP TABLE "public"."modules";

-- DropTable
DROP TABLE "public"."monthly_assignment_grade_history";

-- DropTable
DROP TABLE "public"."monthly_assignments";

-- DropTable
DROP TABLE "public"."projection_categories";

-- DropTable
DROP TABLE "public"."projection_template_subjects";

-- DropTable
DROP TABLE "public"."projection_templates";

-- DropTable
DROP TABLE "public"."quarter_grade_percentages";

-- DropTable
DROP TABLE "public"."quarter_holidays";

-- DropTable
DROP TABLE "public"."recurring_extra_charges";

-- DropTable
DROP TABLE "public"."roles";

-- DropTable
DROP TABLE "public"."roles_modules_school";

-- DropTable
DROP TABLE "public"."school_modules";

-- DropTable
DROP TABLE "public"."school_monthly_assignment_templates";

-- DropTable
DROP TABLE "public"."student_billing_configs";

-- DropTable
DROP TABLE "public"."student_scholarships";

-- DropTable
DROP TABLE "public"."taxable_invoices";

-- DropTable
DROP TABLE "public"."teacher_students";

-- DropTable
DROP TABLE "public"."tuition_configs";

-- DropTable
DROP TABLE "public"."tuition_types";

-- DropTable
DROP TABLE "public"."user_roles";

-- DropTable
DROP TABLE "public"."user_students";

-- DropEnum
DROP TYPE "public"."StudentStatus";

-- CreateIndex
CREATE INDEX "school_years_school_id_idx" ON "school_years"("school_id");
