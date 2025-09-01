-- DropForeignKey
ALTER TABLE `pharmacyrequestitem` DROP FOREIGN KEY `PharmacyRequestItem_id_fkey`;

-- AlterTable
ALTER TABLE `pharmacyrequestitem` MODIFY `userAproverId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `PharmacyRequestItem` ADD CONSTRAINT `PharmacyRequestItem_pharmacyRequestId_fkey` FOREIGN KEY (`pharmacyRequestId`) REFERENCES `PharmacyRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
