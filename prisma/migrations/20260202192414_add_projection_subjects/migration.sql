-- CreateTable
CREATE TABLE "projection_subjects" (
    "id" TEXT NOT NULL,
    "projection_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projection_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projection_subjects_projection_id_idx" ON "projection_subjects"("projection_id");

-- CreateIndex
CREATE INDEX "projection_subjects_subject_id_idx" ON "projection_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "projection_subjects_projection_id_subject_id_key" ON "projection_subjects"("projection_id", "subject_id");

-- AddForeignKey
ALTER TABLE "projection_subjects" ADD CONSTRAINT "projection_subjects_projection_id_fkey" FOREIGN KEY ("projection_id") REFERENCES "projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_subjects" ADD CONSTRAINT "projection_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
