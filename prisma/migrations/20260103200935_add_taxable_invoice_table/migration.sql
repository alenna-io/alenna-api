/*
  Warnings:

  - You are about to drop the column `taxable_bill_required` on the `student_scholarships` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "student_scholarships" DROP COLUMN "taxable_bill_required";

-- CreateTable
CREATE TABLE "TaxableInvoice" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxableInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxableInvoice_student_id_key" ON "TaxableInvoice"("student_id");

-- AddForeignKey
ALTER TABLE "TaxableInvoice" ADD CONSTRAINT "TaxableInvoice_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
