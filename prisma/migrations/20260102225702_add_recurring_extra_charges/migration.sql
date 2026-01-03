-- CreateTable
CREATE TABLE "recurring_extra_charges" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_extra_charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_extra_charges_student_id_idx" ON "recurring_extra_charges"("student_id");

-- CreateIndex
CREATE INDEX "recurring_extra_charges_expires_at_idx" ON "recurring_extra_charges"("expires_at");

-- CreateIndex
CREATE INDEX "recurring_extra_charges_student_id_expires_at_idx" ON "recurring_extra_charges"("student_id", "expires_at");

-- AddForeignKey
ALTER TABLE "recurring_extra_charges" ADD CONSTRAINT "recurring_extra_charges_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
