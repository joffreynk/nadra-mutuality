/*
  Warnings:

  - You are about to drop the column `defaultCoveragePercent` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `emailNotifications` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `enableAccountLockout` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `enableTwoFactor` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `failedLoginThreshold` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `requireStrongPasswords` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `sessionTimeoutMinutes` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `smsNotifications` on the `systemsetting` table. All the data in the column will be lost.
  - You are about to drop the column `systemAlerts` on the `systemsetting` table. All the data in the column will be lost.
  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `systemsetting` DROP COLUMN `defaultCoveragePercent`,
    DROP COLUMN `emailNotifications`,
    DROP COLUMN `enableAccountLockout`,
    DROP COLUMN `enableTwoFactor`,
    DROP COLUMN `failedLoginThreshold`,
    DROP COLUMN `requireStrongPasswords`,
    DROP COLUMN `sessionTimeoutMinutes`,
    DROP COLUMN `smsNotifications`,
    DROP COLUMN `systemAlerts`,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `name` VARCHAR(191) NOT NULL;
