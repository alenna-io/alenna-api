-- CreateTable
CREATE TABLE "projection_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "school_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projection_template_subjects" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "sub_subject_id" TEXT NOT NULL,
    "start_pace" INTEGER NOT NULL,
    "end_pace" INTEGER NOT NULL,
    "skip_paces" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "not_pair_with" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extend_to_next" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projection_template_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projection_templates_school_id_idx" ON "projection_templates"("school_id");

-- CreateIndex
CREATE INDEX "projection_templates_school_id_level_idx" ON "projection_templates"("school_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "projection_templates_school_id_level_name_key" ON "projection_templates"("school_id", "level", "name");

-- CreateIndex
CREATE INDEX "projection_template_subjects_template_id_idx" ON "projection_template_subjects"("template_id");

-- CreateIndex
CREATE INDEX "projection_template_subjects_sub_subject_id_idx" ON "projection_template_subjects"("sub_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "projection_template_subjects_template_id_sub_subject_id_key" ON "projection_template_subjects"("template_id", "sub_subject_id");

-- AddForeignKey
ALTER TABLE "projection_templates" ADD CONSTRAINT "projection_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_template_subjects" ADD CONSTRAINT "projection_template_subjects_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "projection_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_template_subjects" ADD CONSTRAINT "projection_template_subjects_sub_subject_id_fkey" FOREIGN KEY ("sub_subject_id") REFERENCES "sub_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
