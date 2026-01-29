-- CreateTable
CREATE TABLE "school_weeks" (
    "id" TEXT NOT NULL,
    "quarter_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarter_holidays" (
    "id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "quarter_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarter_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_weeks_quarter_id_idx" ON "school_weeks"("quarter_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_weeks_quarter_id_week_number_key" ON "school_weeks"("quarter_id", "week_number");

-- CreateIndex
CREATE INDEX "quarter_holidays_school_year_id_idx" ON "quarter_holidays"("school_year_id");

-- CreateIndex
CREATE INDEX "quarter_holidays_quarter_id_idx" ON "quarter_holidays"("quarter_id");

-- AddForeignKey
ALTER TABLE "school_weeks" ADD CONSTRAINT "school_weeks_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "quarters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarter_holidays" ADD CONSTRAINT "quarter_holidays_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarter_holidays" ADD CONSTRAINT "quarter_holidays_quarter_id_fkey" FOREIGN KEY ("quarter_id") REFERENCES "quarters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
