/*
  Warnings:

  - You are about to drop the column `category` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `coveragePercent` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `paidBy` on the `member` table. All the data in the column will be lost.
  - Added the required column `categoryID` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `member` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `member` DROP COLUMN `category`,
    DROP COLUMN `coveragePercent`,
    DROP COLUMN `paidBy`,
    ADD COLUMN `categoryID` VARCHAR(191) NOT NULL,
    MODIFY `address` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_categoryID_fkey` FOREIGN KEY (`categoryID`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
