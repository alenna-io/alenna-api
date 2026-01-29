-- AlterTable
ALTER TABLE "monthly_assignment_grade_history" RENAME CONSTRAINT "monthly_goal_grade_history_pkey" TO "monthly_assignment_grade_history_pkey";

-- AlterTable
ALTER TABLE "monthly_assignment_templates" RENAME CONSTRAINT "monthly_goal_templates_pkey" TO "monthly_assignment_templates_pkey";

-- AlterTable
ALTER TABLE "projection_monthly_assignments" RENAME CONSTRAINT "projection_monthly_goals_pkey" TO "projection_monthly_assignments_pkey";

-- RenameForeignKey
ALTER TABLE "monthly_assignment_grade_history" RENAME CONSTRAINT "monthly_assignment_grade_history_projection_monthly_assignment_" TO "monthly_assignment_grade_history_projection_monthly_assign_fkey";

-- RenameForeignKey
ALTER TABLE "projection_monthly_assignments" RENAME CONSTRAINT "projection_monthly_assignments_monthly_assignment_template_id_f" TO "projection_monthly_assignments_monthly_assignment_template_fkey";

-- RenameIndex
ALTER INDEX "monthly_assignment_grade_history_projection_monthly_assignment_" RENAME TO "monthly_assignment_grade_history_projection_monthly_assignm_idx";

-- RenameIndex
ALTER INDEX "projection_monthly_assignments_projection_id_monthly_assignment" RENAME TO "projection_monthly_assignments_projection_id_monthly_assign_key";
