/*
  Warnings:

  - You are about to drop the column `companyId` on the `invoice` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `invoice` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `invoice` table. All the data in the column will be lost.
  - You are about to drop the `claim` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `period` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `claim` DROP FOREIGN KEY `Claim_memberId_fkey`;

-- DropForeignKey
ALTER TABLE `claim` DROP FOREIGN KEY `Claim_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `invoice` DROP FOREIGN KEY `Invoice_companyId_fkey`;

-- DropIndex
DROP INDEX `Invoice_companyId_fkey` ON `invoice`;

-- AlterTable
ALTER TABLE `invoice` DROP COLUMN `companyId`,
    DROP COLUMN `periodEnd`,
    DROP COLUMN `periodStart`,
    ADD COLUMN `period` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `member` MODIFY `endOfSubscription` DATETIME(3) NOT NULL DEFAULT DATE_ADD(NOW(), INTERVAL 6 MONTH);

-- DropTable
DROP TABLE `claim`;
