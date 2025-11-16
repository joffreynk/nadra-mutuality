/*
  Warnings:

  - You are about to drop the column `dependentProofUrl` on the `member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `member` DROP COLUMN `dependentProofUrl`,
    MODIFY `dob` DATETIME(3) NULL,
    MODIFY `address` VARCHAR(191) NULL,
    MODIFY `endOfSubscription` DATETIME(3) NOT NULL DEFAULT DATE_ADD(NOW(), INTERVAL 6 MONTH);
