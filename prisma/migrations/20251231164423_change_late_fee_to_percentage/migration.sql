/*
  Warnings:

  - You are about to drop the column `late_fee_amount` on the `tuition_configs` table. All the data in the column will be lost.

*/
-- Step 1: Add the new column as nullable
ALTER TABLE "tuition_configs" ADD COLUMN "late_fee_percentage" DECIMAL(5,2);

-- Step 2: Calculate percentage from existing late_fee_amount and base_tuition_amount
-- Formula: (late_fee_amount / base_tuition_amount) * 100
-- If base_tuition_amount is 0 or NULL, default to 5.0 (5%)
UPDATE "tuition_configs" 
SET "late_fee_percentage" = CASE 
  WHEN "base_tuition_amount" > 0 THEN 
    ROUND(("late_fee_amount" / "base_tuition_amount") * 100, 2)
  ELSE 5.0
END;

-- Step 3: Make the column non-nullable (with default for safety)
ALTER TABLE "tuition_configs" ALTER COLUMN "late_fee_percentage" SET NOT NULL;
ALTER TABLE "tuition_configs" ALTER COLUMN "late_fee_percentage" SET DEFAULT 5.0;

-- Step 4: Drop the old column
ALTER TABLE "tuition_configs" DROP COLUMN "late_fee_amount";
