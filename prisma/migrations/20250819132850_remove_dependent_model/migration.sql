/*
  Warnings:

  - You are about to drop the column `cloudinaryId` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `dependentProofId` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `mainId` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `passportPhotoId` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `receiptCloudinaryId` on the `pharmacyrequest` table. All the data in the column will be lost.
  - You are about to drop the column `receiptCloudinaryUrl` on the `pharmacyrequest` table. All the data in the column will be lost.
  - You are about to drop the column `receiptCloudinaryId` on the `treatment` table. All the data in the column will be lost.
  - You are about to drop the column `receiptCloudinaryUrl` on the `treatment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[memberCode]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memberCode` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `document` DROP COLUMN `cloudinaryId`,
    ADD COLUMN `url` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `member` DROP COLUMN `dependentProofId`,
    DROP COLUMN `mainId`,
    DROP COLUMN `passportPhotoId`,
    ADD COLUMN `memberCode` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `pharmacyrequest` DROP COLUMN `receiptCloudinaryId`,
    DROP COLUMN `receiptCloudinaryUrl`,
    ADD COLUMN `receiptUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `treatment` DROP COLUMN `receiptCloudinaryId`,
    DROP COLUMN `receiptCloudinaryUrl`,
    ADD COLUMN `receiptUrl` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Member_memberCode_key` ON `Member`(`memberCode`);
