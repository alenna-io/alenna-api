-- CreateEnum
CREATE TYPE "ProjectionMonthlyGoalStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "monthly_goal_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_goal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarter_grade_percentages" (
    "id" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarter_grade_percentages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projection_monthly_goals" (
    "id" TEXT NOT NULL,
    "projection_id" TEXT NOT NULL,
    "monthly_goal_template_id" TEXT NOT NULL,
    "grade" INTEGER,
    "status" "ProjectionMonthlyGoalStatus" NOT NULL DEFAULT 'PENDING',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projection_monthly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_goal_grade_history" (
    "id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "projection_monthly_goal_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_goal_grade_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_goal_templates_school_year_id_idx" ON "monthly_goal_templates"("school_year_id");

-- CreateIndex
CREATE INDEX "monthly_goal_templates_school_year_id_quarter_idx" ON "monthly_goal_templates"("school_year_id", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_goal_templates_school_year_id_quarter_name_key" ON "monthly_goal_templates"("school_year_id", "quarter", "name");

-- CreateIndex
CREATE INDEX "quarter_grade_percentages_school_year_id_idx" ON "quarter_grade_percentages"("school_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "quarter_grade_percentages_school_year_id_quarter_key" ON "quarter_grade_percentages"("school_year_id", "quarter");

-- CreateIndex
CREATE INDEX "projection_monthly_goals_projection_id_idx" ON "projection_monthly_goals"("projection_id");

-- CreateIndex
CREATE INDEX "projection_monthly_goals_projection_id_status_idx" ON "projection_monthly_goals"("projection_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projection_monthly_goals_projection_id_monthly_goal_templat_key" ON "projection_monthly_goals"("projection_id", "monthly_goal_template_id");

-- CreateIndex
CREATE INDEX "monthly_goal_grade_history_projection_monthly_goal_id_idx" ON "monthly_goal_grade_history"("projection_monthly_goal_id");

-- AddForeignKey
ALTER TABLE "monthly_goal_templates" ADD CONSTRAINT "monthly_goal_templates_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarter_grade_percentages" ADD CONSTRAINT "quarter_grade_percentages_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_monthly_goals" ADD CONSTRAINT "projection_monthly_goals_projection_id_fkey" FOREIGN KEY ("projection_id") REFERENCES "projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_monthly_goals" ADD CONSTRAINT "projection_monthly_goals_monthly_goal_template_id_fkey" FOREIGN KEY ("monthly_goal_template_id") REFERENCES "monthly_goal_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_goal_grade_history" ADD CONSTRAINT "monthly_goal_grade_history_projection_monthly_goal_id_fkey" FOREIGN KEY ("projection_monthly_goal_id") REFERENCES "projection_monthly_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
