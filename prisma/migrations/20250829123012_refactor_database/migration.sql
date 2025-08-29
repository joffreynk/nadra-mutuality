/*
  Warnings:

  - You are about to drop the column `insurerShare` on the `pharmacyrequest` table. All the data in the column will be lost.
  - You are about to drop the column `memberShare` on the `pharmacyrequest` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `pharmacyrequest` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `pharmacyrequest` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `pharmacyrequest` table. All the data in the column will be lost.
  - You are about to drop the column `medicineId` on the `pharmacyrequestitem` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `pharmacyrequestitem` table. All the data in the column will be lost.
  - You are about to drop the column `insurerShare` on the `treatment` table. All the data in the column will be lost.
  - You are about to drop the column `memberShare` on the `treatment` table. All the data in the column will be lost.
  - You are about to drop the column `providerType` on the `treatment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `treatment` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `treatment` table. All the data in the column will be lost.
  - You are about to drop the column `medicineId` on the `treatmentitem` table. All the data in the column will be lost.
  - You are about to drop the `medicine` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `usercreator` to the `PharmacyRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mdecineName` to the `PharmacyRequestItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pharmacyRequestId` to the `PharmacyRequestItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PharmacyRequestItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userAproverId` to the `PharmacyRequestItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usercreator` to the `Treatment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TreatmentItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `medicine` DROP FOREIGN KEY `Medicine_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `pharmacyrequestitem` DROP FOREIGN KEY `PharmacyRequestItem_medicineId_fkey`;

-- DropForeignKey
ALTER TABLE `pharmacyrequestitem` DROP FOREIGN KEY `PharmacyRequestItem_requestId_fkey`;

-- DropForeignKey
ALTER TABLE `treatmentitem` DROP FOREIGN KEY `TreatmentItem_medicineId_fkey`;

-- DropIndex
DROP INDEX `PharmacyRequestItem_medicineId_fkey` ON `pharmacyrequestitem`;

-- DropIndex
DROP INDEX `PharmacyRequestItem_requestId_fkey` ON `pharmacyrequestitem`;

-- DropIndex
DROP INDEX `TreatmentItem_medicineId_fkey` ON `treatmentitem`;

-- AlterTable
ALTER TABLE `pharmacyrequest` DROP COLUMN `insurerShare`,
    DROP COLUMN `memberShare`,
    DROP COLUMN `receiptUrl`,
    DROP COLUMN `status`,
    DROP COLUMN `totalAmount`,
    ADD COLUMN `usercreator` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `pharmacyrequestitem` DROP COLUMN `medicineId`,
    DROP COLUMN `requestId`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `insurerShare` DECIMAL(10, 2) NULL,
    ADD COLUMN `mdecineName` VARCHAR(191) NOT NULL,
    ADD COLUMN `memberShare` DECIMAL(10, 2) NULL,
    ADD COLUMN `pharmacyRequestId` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `userAproverId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `treatment` DROP COLUMN `insurerShare`,
    DROP COLUMN `memberShare`,
    DROP COLUMN `providerType`,
    DROP COLUMN `status`,
    DROP COLUMN `totalAmount`,
    ADD COLUMN `usercreator` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `treatmentitem` DROP COLUMN `medicineId`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `insurerShare` DECIMAL(10, 2) NULL,
    ADD COLUMN `memberShare` DECIMAL(10, 2) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- DropTable
DROP TABLE `medicine`;

-- CreateTable
CREATE TABLE `PharmacyRequestReceipt` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `pharmacyRequestId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_usercreator_fkey` FOREIGN KEY (`usercreator`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PharmacyRequest` ADD CONSTRAINT `PharmacyRequest_usercreator_fkey` FOREIGN KEY (`usercreator`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PharmacyRequestItem` ADD CONSTRAINT `PharmacyRequestItem_id_fkey` FOREIGN KEY (`id`) REFERENCES `PharmacyRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PharmacyRequestItem` ADD CONSTRAINT `PharmacyRequestItem_userAproverId_fkey` FOREIGN KEY (`userAproverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PharmacyRequestReceipt` ADD CONSTRAINT `PharmacyRequestReceipt_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PharmacyRequestReceipt` ADD CONSTRAINT `PharmacyRequestReceipt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PharmacyRequestReceipt` ADD CONSTRAINT `PharmacyRequestReceipt_pharmacyRequestId_fkey` FOREIGN KEY (`pharmacyRequestId`) REFERENCES `PharmacyRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
