-- CreateTable
CREATE TABLE `SystemSetting` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `systemName` VARCHAR(191) NOT NULL DEFAULT 'Nadra Healthcare Insurance',
    `defaultCoveragePercent` INTEGER NOT NULL DEFAULT 80,
    `sessionTimeoutMinutes` INTEGER NOT NULL DEFAULT 30,
    `enableTwoFactor` BOOLEAN NOT NULL DEFAULT true,
    `requireStrongPasswords` BOOLEAN NOT NULL DEFAULT true,
    `enableAccountLockout` BOOLEAN NOT NULL DEFAULT true,
    `failedLoginThreshold` INTEGER NOT NULL DEFAULT 5,
    `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `smsNotifications` BOOLEAN NOT NULL DEFAULT false,
    `systemAlerts` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSetting_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SystemSetting` ADD CONSTRAINT `SystemSetting_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
