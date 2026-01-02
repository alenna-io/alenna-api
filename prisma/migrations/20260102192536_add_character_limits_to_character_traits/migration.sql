/*
  Warnings:

  - You are about to alter the column `character_trait` on the `character_traits` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - You are about to alter the column `verse_text` on the `character_traits` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(250)`.
  - You are about to alter the column `verse_reference` on the `character_traits` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "character_traits" ALTER COLUMN "character_trait" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "verse_text" SET DATA TYPE VARCHAR(250),
ALTER COLUMN "verse_reference" SET DATA TYPE VARCHAR(50);
