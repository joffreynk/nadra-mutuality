/*
  Warnings:

  - You are about to drop the `card` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dependent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `card` DROP FOREIGN KEY `Card_memberId_fkey`;

-- DropForeignKey
ALTER TABLE `card` DROP FOREIGN KEY `Card_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `dependent` DROP FOREIGN KEY `Dependent_childMemberId_fkey`;

-- DropForeignKey
ALTER TABLE `dependent` DROP FOREIGN KEY `Dependent_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `dependent` DROP FOREIGN KEY `Dependent_parentMemberId_fkey`;

-- AlterTable
ALTER TABLE `member` ADD COLUMN `isDependent` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `card`;

-- DropTable
DROP TABLE `dependent`;
