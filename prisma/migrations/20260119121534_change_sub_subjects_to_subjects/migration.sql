-- DropForeignKey (if exists)
ALTER TABLE "public"."pace_catalog" DROP CONSTRAINT IF EXISTS "pace_catalog_sub_subject_id_fkey";

-- DropForeignKey from projection_template_subjects if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projection_template_subjects') THEN
        ALTER TABLE "public"."projection_template_subjects" DROP CONSTRAINT IF EXISTS "projection_template_subjects_sub_subject_id_fkey";
    END IF;
END $$;

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "category_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- Copy data from sub_subjects to subjects
INSERT INTO "subjects" ("id", "name", "difficulty", "category_id", "level_id", "created_at", "updated_at")
SELECT "id", "name", "difficulty", "category_id", "level_id", "created_at", "updated_at"
FROM "sub_subjects";

-- CreateIndex
CREATE INDEX "subjects_category_id_idx" ON "subjects"("category_id");

-- CreateIndex
CREATE INDEX "subjects_level_id_idx" ON "subjects"("level_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_category_id_name_key" ON "subjects"("category_id", "name");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pace_catalog" ADD CONSTRAINT "pace_catalog_sub_subject_id_fkey" FOREIGN KEY ("sub_subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey (if exists)
ALTER TABLE "public"."sub_subjects" DROP CONSTRAINT IF EXISTS "sub_subjects_category_id_fkey";

-- DropForeignKey (if exists)
ALTER TABLE "public"."sub_subjects" DROP CONSTRAINT IF EXISTS "sub_subjects_level_id_fkey";

-- DropTable (with CASCADE to handle any remaining dependencies)
DROP TABLE IF EXISTS "public"."sub_subjects" CASCADE;
