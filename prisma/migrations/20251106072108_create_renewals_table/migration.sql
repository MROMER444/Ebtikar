-- CreateTable
CREATE TABLE `unsubscribes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `msisdn` VARCHAR(191) NOT NULL,
    `service_name` VARCHAR(191) NOT NULL,
    `cancel_date` DATETIME(3) NOT NULL,
    `cancel_by` VARCHAR(191) NULL,
    `tracking_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `request_data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `renewals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `msisdn` VARCHAR(191) NOT NULL,
    `service_name` VARCHAR(191) NOT NULL,
    `debit_date` DATETIME(3) NOT NULL,
    `expiration_date` DATETIME(3) NOT NULL,
    `transaction_id` VARCHAR(191) NOT NULL,
    `conversation_id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `request_data` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
