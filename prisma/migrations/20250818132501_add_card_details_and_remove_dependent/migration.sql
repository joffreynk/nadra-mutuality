/*
  Warnings:

  - You are about to drop the column `dependentId` on the `card` table. All the data in the column will be lost.
  - Added the required column `memberMainId` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memberName` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Made the column `memberId` on table `card` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `card` DROP FOREIGN KEY `Card_dependentId_fkey`;

-- DropForeignKey
ALTER TABLE `card` DROP FOREIGN KEY `Card_memberId_fkey`;

-- DropIndex
DROP INDEX `Card_dependentId_fkey` ON `card`;

-- DropIndex
DROP INDEX `Card_memberId_fkey` ON `card`;

-- AlterTable
ALTER TABLE `card` DROP COLUMN `dependentId`,
    ADD COLUMN `memberAddress` VARCHAR(191) NULL,
    ADD COLUMN `memberCompanyName` VARCHAR(191) NULL,
    ADD COLUMN `memberContact` VARCHAR(191) NULL,
    ADD COLUMN `memberMainId` VARCHAR(191) NOT NULL,
    ADD COLUMN `memberName` VARCHAR(191) NOT NULL,
    ADD COLUMN `memberPassportPhotoUrl` VARCHAR(191) NULL,
    MODIFY `memberId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
