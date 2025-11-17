-- CreateTable
CREATE TABLE "school_monthly_assignment_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_monthly_assignment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarter_grade_percentages" (
    "id" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarter_grade_percentages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_monthly_assignment_templates_school_year_id_idx" ON "school_monthly_assignment_templates"("school_year_id");

-- CreateIndex
CREATE INDEX "school_monthly_assignment_templates_school_year_id_quarter_idx" ON "school_monthly_assignment_templates"("school_year_id", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "school_monthly_assignment_templates_school_year_id_quarter__key" ON "school_monthly_assignment_templates"("school_year_id", "quarter", "name");

-- CreateIndex
CREATE INDEX "quarter_grade_percentages_school_year_id_idx" ON "quarter_grade_percentages"("school_year_id");

-- CreateIndex
CREATE INDEX "quarter_grade_percentages_school_year_id_quarter_idx" ON "quarter_grade_percentages"("school_year_id", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "quarter_grade_percentages_school_year_id_quarter_key" ON "quarter_grade_percentages"("school_year_id", "quarter");

-- AddForeignKey
ALTER TABLE "school_monthly_assignment_templates" ADD CONSTRAINT "school_monthly_assignment_templates_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarter_grade_percentages" ADD CONSTRAINT "quarter_grade_percentages_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
