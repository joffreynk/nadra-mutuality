/*
  Warnings:

  - You are about to drop the column `partnerId` on the `invoice` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `member` table. All the data in the column will be lost.
  - You are about to drop the `partner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `invoice` DROP FOREIGN KEY `Invoice_partnerId_fkey`;

-- DropForeignKey
ALTER TABLE `partner` DROP FOREIGN KEY `Partner_organizationId_fkey`;

-- DropIndex
DROP INDEX `Invoice_partnerId_fkey` ON `invoice`;

-- AlterTable
ALTER TABLE `invoice` DROP COLUMN `partnerId`,
    ADD COLUMN `companyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `member` DROP COLUMN `companyName`,
    ADD COLUMN `companyId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `partner`;

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
