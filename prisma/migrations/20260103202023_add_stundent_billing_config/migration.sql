-- AlterTable
ALTER TABLE "taxable_invoices" ADD COLUMN     "pdf_file_url" TEXT,
ADD COLUMN     "xml_file_url" TEXT;

-- CreateTable
CREATE TABLE "student_billing_configs" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "requires_taxable_invoice" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_billing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_billing_configs_student_id_key" ON "student_billing_configs"("student_id");

-- CreateIndex
CREATE INDEX "student_billing_configs_student_id_idx" ON "student_billing_configs"("student_id");

-- AddForeignKey
ALTER TABLE "student_billing_configs" ADD CONSTRAINT "student_billing_configs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
