-- AlterTable
ALTER TABLE "student_scholarships" ADD COLUMN     "custom_base_amount" DECIMAL(10,2),
ALTER COLUMN "scholarship_type" DROP NOT NULL,
ALTER COLUMN "scholarship_value" DROP NOT NULL;
