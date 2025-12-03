-- CreateTable
CREATE TABLE "projection_categories" (
    "id" TEXT NOT NULL,
    "projection_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projection_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projection_categories_projection_id_idx" ON "projection_categories"("projection_id");

-- CreateIndex
CREATE INDEX "projection_categories_category_id_idx" ON "projection_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "projection_categories_projection_id_category_id_key" ON "projection_categories"("projection_id", "category_id");

-- AddForeignKey
ALTER TABLE "projection_categories" ADD CONSTRAINT "projection_categories_projection_id_fkey" FOREIGN KEY ("projection_id") REFERENCES "projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_categories" ADD CONSTRAINT "projection_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
