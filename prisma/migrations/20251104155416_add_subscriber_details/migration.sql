-- CreateTable
CREATE TABLE `subscriber_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `msisdn` VARCHAR(191) NOT NULL,
    `created_at` VARCHAR(191) NOT NULL,
    `device_type` VARCHAR(191) NOT NULL,
    `service_name` VARCHAR(191) NOT NULL,
    `expiration_date` VARCHAR(191) NOT NULL,
    `subscription` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    `amount` DOUBLE NULL,
    `request_data` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
