-- AlterTable
ALTER TABLE "grade_history" ALTER COLUMN "grade" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "monthly_assignment_grade_history" ALTER COLUMN "grade" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "projection_monthly_assignments" ALTER COLUMN "grade" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "projection_paces" ALTER COLUMN "grade" SET DATA TYPE DECIMAL(65,30);
