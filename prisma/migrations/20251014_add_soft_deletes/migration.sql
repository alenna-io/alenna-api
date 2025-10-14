-- Add deletedAt column to all tables for soft deletes
ALTER TABLE "schools" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "certification_types" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "students" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "projections" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "parents" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "paces" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "daily_goals" ADD COLUMN "deletedAt" TIMESTAMP(3);

