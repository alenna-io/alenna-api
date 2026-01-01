-- CreateTable
CREATE TABLE "tuition_configs" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "base_tuition_amount" DECIMAL(10,2) NOT NULL,
    "late_fee_amount" DECIMAL(10,2) NOT NULL,
    "due_day" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tuition_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_scholarships" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "scholarship_type" TEXT NOT NULL,
    "scholarship_value" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "billing_month" INTEGER NOT NULL,
    "billing_year" INTEGER NOT NULL,
    "base_amount" DECIMAL(10,2) NOT NULL,
    "scholarship_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(10,2) NOT NULL,
    "late_fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "late_fee_applied_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3),
    "payment_method" TEXT,
    "payment_note" TEXT,
    "payment_gateway" TEXT,
    "payment_transaction_id" TEXT,
    "payment_gateway_status" TEXT,
    "payment_webhook_received_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "status_changed_by" TEXT,
    "paid_by" TEXT,
    "late_fee_applied_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tuition_configs_school_id_key" ON "tuition_configs"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_scholarships_student_id_key" ON "student_scholarships"("student_id");

-- CreateIndex
CREATE INDEX "student_scholarships_student_id_idx" ON "student_scholarships"("student_id");

-- CreateIndex
CREATE INDEX "billing_records_student_id_idx" ON "billing_records"("student_id");

-- CreateIndex
CREATE INDEX "billing_records_school_year_id_idx" ON "billing_records"("school_year_id");

-- CreateIndex
CREATE INDEX "billing_records_status_idx" ON "billing_records"("status");

-- CreateIndex
CREATE INDEX "billing_records_billing_month_idx" ON "billing_records"("billing_month");

-- CreateIndex
CREATE INDEX "billing_records_billing_year_idx" ON "billing_records"("billing_year");

-- CreateIndex
CREATE INDEX "billing_records_payment_transaction_id_idx" ON "billing_records"("payment_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_records_student_id_billing_month_billing_year_key" ON "billing_records"("student_id", "billing_month", "billing_year");

-- AddForeignKey
ALTER TABLE "tuition_configs" ADD CONSTRAINT "tuition_configs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_scholarships" ADD CONSTRAINT "student_scholarships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
