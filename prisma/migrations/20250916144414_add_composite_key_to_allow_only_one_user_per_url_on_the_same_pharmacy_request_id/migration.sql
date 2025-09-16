/*
  Warnings:

  - A unique constraint covering the columns `[userId,pharmacyRequestId]` on the table `PharmacyRequestReceipt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `PharmacyRequestReceipt_userId_pharmacyRequestId_key` ON `PharmacyRequestReceipt`(`userId`, `pharmacyRequestId`);
