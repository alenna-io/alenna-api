-- CreateTable
CREATE TABLE "character_traits" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "character_trait" TEXT NOT NULL,
    "verse_text" TEXT NOT NULL,
    "verse_reference" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_traits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "character_traits_school_id_idx" ON "character_traits"("school_id");

-- CreateIndex
CREATE INDEX "character_traits_school_year_id_idx" ON "character_traits"("school_year_id");

-- CreateIndex
CREATE INDEX "character_traits_school_year_id_month_idx" ON "character_traits"("school_year_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "character_traits_school_id_school_year_id_month_key" ON "character_traits"("school_id", "school_year_id", "month");

-- AddForeignKey
ALTER TABLE "character_traits" ADD CONSTRAINT "character_traits_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_traits" ADD CONSTRAINT "character_traits_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
