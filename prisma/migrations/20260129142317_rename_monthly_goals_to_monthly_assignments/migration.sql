-- Rename enum type
ALTER TYPE "ProjectionMonthlyGoalStatus" RENAME TO "ProjectionMonthlyAssignmentStatus";

-- Rename tables
ALTER TABLE "monthly_goal_templates" RENAME TO "monthly_assignment_templates";
ALTER TABLE "projection_monthly_goals" RENAME TO "projection_monthly_assignments";
ALTER TABLE "monthly_goal_grade_history" RENAME TO "monthly_assignment_grade_history";

-- Rename columns in projection_monthly_assignments
ALTER TABLE "projection_monthly_assignments" RENAME COLUMN "monthly_goal_template_id" TO "monthly_assignment_template_id";

-- Rename columns in monthly_assignment_grade_history
ALTER TABLE "monthly_assignment_grade_history" RENAME COLUMN "projection_monthly_goal_id" TO "projection_monthly_assignment_id";

-- Drop old indexes
DROP INDEX IF EXISTS "monthly_goal_templates_school_year_id_idx";
DROP INDEX IF EXISTS "monthly_goal_templates_school_year_id_quarter_idx";
DROP INDEX IF EXISTS "monthly_goal_templates_school_year_id_quarter_name_key";
DROP INDEX IF EXISTS "projection_monthly_goals_projection_id_idx";
DROP INDEX IF EXISTS "projection_monthly_goals_projection_id_status_idx";
DROP INDEX IF EXISTS "projection_monthly_goals_projection_id_monthly_goal_templat_key";
DROP INDEX IF EXISTS "monthly_goal_grade_history_projection_monthly_goal_id_idx";

-- Create new indexes with updated names
CREATE INDEX "monthly_assignment_templates_school_year_id_idx" ON "monthly_assignment_templates"("school_year_id");
CREATE INDEX "monthly_assignment_templates_school_year_id_quarter_idx" ON "monthly_assignment_templates"("school_year_id", "quarter");
CREATE UNIQUE INDEX "monthly_assignment_templates_school_year_id_quarter_name_key" ON "monthly_assignment_templates"("school_year_id", "quarter", "name");
CREATE INDEX "projection_monthly_assignments_projection_id_idx" ON "projection_monthly_assignments"("projection_id");
CREATE INDEX "projection_monthly_assignments_projection_id_status_idx" ON "projection_monthly_assignments"("projection_id", "status");
CREATE UNIQUE INDEX "projection_monthly_assignments_projection_id_monthly_assignment_template_id_key" ON "projection_monthly_assignments"("projection_id", "monthly_assignment_template_id");
CREATE INDEX "monthly_assignment_grade_history_projection_monthly_assignment_id_idx" ON "monthly_assignment_grade_history"("projection_monthly_assignment_id");

-- Drop old foreign key constraints
ALTER TABLE "monthly_assignment_templates" DROP CONSTRAINT IF EXISTS "monthly_goal_templates_school_year_id_fkey";
ALTER TABLE "projection_monthly_assignments" DROP CONSTRAINT IF EXISTS "projection_monthly_goals_monthly_goal_template_id_fkey";
ALTER TABLE "projection_monthly_assignments" DROP CONSTRAINT IF EXISTS "projection_monthly_goals_projection_id_fkey";
ALTER TABLE "monthly_assignment_grade_history" DROP CONSTRAINT IF EXISTS "monthly_goal_grade_history_projection_monthly_goal_id_fkey";

-- Add new foreign key constraints with updated names
ALTER TABLE "monthly_assignment_templates" ADD CONSTRAINT "monthly_assignment_templates_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projection_monthly_assignments" ADD CONSTRAINT "projection_monthly_assignments_projection_id_fkey" FOREIGN KEY ("projection_id") REFERENCES "projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projection_monthly_assignments" ADD CONSTRAINT "projection_monthly_assignments_monthly_assignment_template_id_fkey" FOREIGN KEY ("monthly_assignment_template_id") REFERENCES "monthly_assignment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monthly_assignment_grade_history" ADD CONSTRAINT "monthly_assignment_grade_history_projection_monthly_assignment_id_fkey" FOREIGN KEY ("projection_monthly_assignment_id") REFERENCES "projection_monthly_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
