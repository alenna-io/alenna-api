-- CreateTable
CREATE TABLE "teacher_students" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_students_teacher_id_idx" ON "teacher_students"("teacher_id");

-- CreateIndex
CREATE INDEX "teacher_students_student_id_idx" ON "teacher_students"("student_id");

-- CreateIndex
CREATE INDEX "teacher_students_school_year_id_idx" ON "teacher_students"("school_year_id");

-- CreateIndex
CREATE INDEX "teacher_students_teacher_id_school_year_id_deleted_at_idx" ON "teacher_students"("teacher_id", "school_year_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_students_teacher_id_student_id_school_year_id_key" ON "teacher_students"("teacher_id", "student_id", "school_year_id");

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
