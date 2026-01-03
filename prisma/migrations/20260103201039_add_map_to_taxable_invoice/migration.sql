/*
  Warnings:

  - You are about to drop the `TaxableInvoice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TaxableInvoice" DROP CONSTRAINT "TaxableInvoice_student_id_fkey";

-- DropTable
DROP TABLE "public"."TaxableInvoice";

-- CreateTable
CREATE TABLE "taxable_invoices" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxable_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taxable_invoices_student_id_key" ON "taxable_invoices"("student_id");

-- CreateIndex
CREATE INDEX "taxable_invoices_student_id_idx" ON "taxable_invoices"("student_id");

-- AddForeignKey
ALTER TABLE "taxable_invoices" ADD CONSTRAINT "taxable_invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
