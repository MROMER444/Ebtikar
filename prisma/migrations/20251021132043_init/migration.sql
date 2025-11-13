/*
  Warnings:

  - You are about to drop the column `name` on the `ServiceProvider` table. All the data in the column will be lost.
  - Added the required column `serviceName` to the `ServiceProvider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ServiceProvider` DROP COLUMN `name`,
    ADD COLUMN `providerName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `serviceName` VARCHAR(191) NOT NULL;
