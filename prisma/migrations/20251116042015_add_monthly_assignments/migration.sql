-- CreateTable
CREATE TABLE "monthly_assignments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "grade" INTEGER,
    "projection_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_assignment_grade_history" (
    "id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "monthly_assignment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_assignment_grade_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_assignments_projection_id_idx" ON "monthly_assignments"("projection_id");

-- CreateIndex
CREATE INDEX "monthly_assignments_projection_id_quarter_idx" ON "monthly_assignments"("projection_id", "quarter");

-- CreateIndex
CREATE INDEX "monthly_assignment_grade_history_monthly_assignment_id_idx" ON "monthly_assignment_grade_history"("monthly_assignment_id");

-- AddForeignKey
ALTER TABLE "monthly_assignments" ADD CONSTRAINT "monthly_assignments_projection_id_fkey" FOREIGN KEY ("projection_id") REFERENCES "projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_assignment_grade_history" ADD CONSTRAINT "monthly_assignment_grade_history_monthly_assignment_id_fkey" FOREIGN KEY ("monthly_assignment_id") REFERENCES "monthly_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
