-- AlterTable
ALTER TABLE "billing_records" ADD COLUMN     "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "billing_records" ALTER COLUMN "payment_status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "student_scholarships" ADD COLUMN     "taxable_bill_required" BOOLEAN NOT NULL DEFAULT false;

-- Data Migration: Update payment_status from 'unpaid' to 'pending'
UPDATE "billing_records" SET "payment_status" = 'pending' WHERE "payment_status" = 'unpaid';

-- Data Migration: Update bill_status from 'cancelled' to 'not_required'
UPDATE "billing_records" SET "bill_status" = 'not_required' WHERE "bill_status" = 'cancelled';

-- Data Migration: Set paid_amount = 0 for all existing records (already defaulted, but explicit for clarity)
UPDATE "billing_records" SET "paid_amount" = 0 WHERE "paid_amount" IS NULL;

-- Data Migration: Update records past due date to 'delayed' status (if not paid)
UPDATE "billing_records" 
SET "payment_status" = 'delayed' 
WHERE "payment_status" IN ('pending', 'unpaid') 
  AND "due_date" < CURRENT_DATE 
  AND "paid_at" IS NULL;
