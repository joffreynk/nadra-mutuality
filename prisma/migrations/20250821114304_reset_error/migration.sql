/*
  Warnings:

  - You are about to drop the column `relationship` on the `member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `member` DROP COLUMN `relationship`,
    ADD COLUMN `familyRelationship` VARCHAR(191) NULL;
