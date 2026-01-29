-- CreateIndex
CREATE INDEX "teacher_students_student_id_school_year_id_deleted_at_idx" ON "teacher_students"("student_id", "school_year_id", "deleted_at");
