/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `HospitalService` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `PharmacyService` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `category` DROP FOREIGN KEY `Category_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `hospitalservice` DROP FOREIGN KEY `HospitalService_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `pharmacyservice` DROP FOREIGN KEY `PharmacyService_organizationId_fkey`;

-- DropIndex
DROP INDEX `Category_organizationId_name_key` ON `category`;

-- DropIndex
DROP INDEX `HospitalService_organizationId_name_key` ON `hospitalservice`;

-- DropIndex
DROP INDEX `PharmacyService_organizationId_code_key` ON `pharmacyservice`;

-- CreateIndex
CREATE INDEX `Category_organizationId_idx` ON `Category`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `Category_name_key` ON `Category`(`name`);

-- CreateIndex
CREATE INDEX `HospitalService_organizationId_idx` ON `HospitalService`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `HospitalService_name_key` ON `HospitalService`(`name`);

-- CreateIndex
CREATE INDEX `PharmacyService_organizationId_idx` ON `PharmacyService`(`organizationId`);

-- CreateIndex
CREATE UNIQUE INDEX `PharmacyService_code_key` ON `PharmacyService`(`code`);

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `PharmacyRequest_organizationId_idx` ON `PharmacyRequest`(`organizationId`);
DROP INDEX `PharmacyRequest_organizationId_fkey` ON `pharmacyrequest`;
