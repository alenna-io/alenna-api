-- CreateTable
CREATE TABLE "billing_payment_transactions" (
    "id" TEXT NOT NULL,
    "billing_record_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_note" TEXT,
    "paid_by" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "billing_payment_transactions_billing_record_id_idx" ON "billing_payment_transactions"("billing_record_id");

-- CreateIndex
CREATE INDEX "billing_payment_transactions_paid_at_idx" ON "billing_payment_transactions"("paid_at");

-- AddForeignKey
ALTER TABLE "billing_payment_transactions" ADD CONSTRAINT "billing_payment_transactions_billing_record_id_fkey" FOREIGN KEY ("billing_record_id") REFERENCES "billing_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
