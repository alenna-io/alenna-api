-- Create tuition_types table first
CREATE TABLE "tuition_types" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "late_fee_type" TEXT NOT NULL,
    "late_fee_value" DECIMAL(10,2) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tuition_types_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tuition_types_school_id_idx" ON "tuition_types"("school_id");
CREATE UNIQUE INDEX "tuition_types_school_id_name_key" ON "tuition_types"("school_id", "name");
ALTER TABLE "tuition_types" ADD CONSTRAINT "tuition_types_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default tuition types from existing tuition_configs
INSERT INTO "tuition_types" ("id", "school_id", "name", "base_amount", "currency", "late_fee_type", "late_fee_value", "display_order", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    "school_id",
    'Default',
    "base_tuition_amount",
    'USD',
    'percentage',
    "late_fee_percentage",
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tuition_configs";

-- Add new columns to billing_records as nullable first
ALTER TABLE "billing_records" 
ADD COLUMN "tuition_type_snapshot" JSONB,
ADD COLUMN "effective_tuition_amount" DECIMAL(10,2),
ADD COLUMN "discount_adjustments" JSONB DEFAULT '[]',
ADD COLUMN "extra_charges" JSONB DEFAULT '[]',
ADD COLUMN "bill_status" TEXT,
ADD COLUMN "payment_status" TEXT DEFAULT 'unpaid',
ADD COLUMN "locked_at" TIMESTAMP(3),
ADD COLUMN "due_date" TIMESTAMP(3),
ADD COLUMN "audit_metadata" JSONB;

-- Migrate basic data for billing_records first
UPDATE "billing_records" br
SET
    "effective_tuition_amount" = br."base_amount",
    "bill_status" = CASE 
        WHEN br."status" = 'paid' THEN 'not_required'
        WHEN br."status" = 'cancelled' THEN 'cancelled'
        ELSE br."status"
    END,
    "payment_status" = CASE 
        WHEN br."status" = 'paid' THEN 'paid'
        ELSE 'unpaid'
    END,
    "locked_at" = CASE 
        WHEN br."status" = 'paid' THEN br."paid_at"
        ELSE NULL
    END,
    "audit_metadata" = jsonb_build_object(
        'createdBy', COALESCE(br."created_by", 'system'),
        'updatedBy', br."updated_by",
        'statusChangedBy', br."status_changed_by",
        'paidBy', br."paid_by",
        'lateFeeAppliedBy', br."late_fee_applied_by"
    );

-- Update tuition_type_snapshot
UPDATE "billing_records" br
SET "tuition_type_snapshot" = (
    SELECT jsonb_build_object(
        'tuitionTypeId', tt."id",
        'tuitionTypeName', tt."name",
        'baseAmount', tt."base_amount",
        'lateFeeType', tt."late_fee_type",
        'lateFeeValue', tt."late_fee_value"
    )
    FROM "tuition_types" tt
    INNER JOIN "students" s ON s."school_id" = tt."school_id"
    WHERE s."id" = br."student_id"
    AND tt."name" = 'Default'
    LIMIT 1
);

-- Update due_date
UPDATE "billing_records" br
SET "due_date" = make_date(
    br."billing_year",
    br."billing_month",
    COALESCE((
        SELECT tc."due_day"
        FROM "tuition_configs" tc
        INNER JOIN "students" s ON s."school_id" = tc."school_id"
        WHERE s."id" = br."student_id"
        LIMIT 1
    ), 5)
);

-- Now make columns NOT NULL
ALTER TABLE "billing_records"
ALTER COLUMN "tuition_type_snapshot" SET NOT NULL,
ALTER COLUMN "effective_tuition_amount" SET NOT NULL,
ALTER COLUMN "bill_status" SET NOT NULL,
ALTER COLUMN "payment_status" SET NOT NULL,
ALTER COLUMN "due_date" SET NOT NULL,
ALTER COLUMN "audit_metadata" SET NOT NULL,
ALTER COLUMN "discount_adjustments" SET NOT NULL,
ALTER COLUMN "extra_charges" SET NOT NULL;

-- Add tuition_type_id to student_scholarships (nullable)
ALTER TABLE "student_scholarships" ADD COLUMN "tuition_type_id" TEXT;
CREATE INDEX "student_scholarships_tuition_type_id_idx" ON "student_scholarships"("tuition_type_id");
ALTER TABLE "student_scholarships" ADD CONSTRAINT "student_scholarships_tuition_type_id_fkey" FOREIGN KEY ("tuition_type_id") REFERENCES "tuition_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate student_scholarships: assign default tuition type to all students
UPDATE "student_scholarships" ss
SET "tuition_type_id" = (
    SELECT tt."id"
    FROM "tuition_types" tt
    INNER JOIN "students" s ON s."school_id" = tt."school_id"
    WHERE s."id" = ss."student_id"
    AND tt."name" = 'Default'
    LIMIT 1
);

-- Drop old columns from billing_records
ALTER TABLE "billing_records" 
DROP COLUMN "base_amount",
DROP COLUMN "created_by",
DROP COLUMN "late_fee_applied_at",
DROP COLUMN "late_fee_applied_by",
DROP COLUMN "paid_by",
DROP COLUMN "status",
DROP COLUMN "status_changed_by",
DROP COLUMN "updated_by";

-- Drop old columns from student_scholarships
ALTER TABLE "student_scholarships" DROP COLUMN "custom_base_amount";

-- Drop old columns from tuition_configs
ALTER TABLE "tuition_configs" 
DROP COLUMN "base_tuition_amount",
DROP COLUMN "late_fee_percentage";

-- Update indexes
DROP INDEX IF EXISTS "public"."billing_records_billing_month_idx";
DROP INDEX IF EXISTS "public"."billing_records_billing_year_idx";
DROP INDEX IF EXISTS "public"."billing_records_status_idx";

CREATE INDEX "billing_records_bill_status_idx" ON "billing_records"("bill_status");
CREATE INDEX "billing_records_payment_status_idx" ON "billing_records"("payment_status");
CREATE INDEX "billing_records_billing_month_billing_year_idx" ON "billing_records"("billing_month", "billing_year");
