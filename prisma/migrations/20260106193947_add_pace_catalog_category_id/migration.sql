-- AlterTable
ALTER TABLE "pace_catalog" ADD COLUMN     "category_id" TEXT;

-- CreateIndex
CREATE INDEX "pace_catalog_category_id_idx" ON "pace_catalog"("category_id");

-- AddForeignKey
ALTER TABLE "pace_catalog" ADD CONSTRAINT "pace_catalog_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
