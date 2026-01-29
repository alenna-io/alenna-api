-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ENROLLED', 'ON_TRACK', 'BEHIND_SCHEDULE', 'AHEAD_OF_SCHEDULE', 'GRADUATED');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "status" "StudentStatus" NOT NULL DEFAULT 'ENROLLED';
