CREATE TABLE `subscribers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'active', 'unsubscribed', 'bounced') NOT NULL DEFAULT 'pending',
    `confirm_token` VARCHAR(191) NOT NULL,
    `unsubscribe_token` VARCHAR(191) NOT NULL,
    `subscribed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confirmed_at` DATETIME(3) NULL,
    `unsubscribed_at` DATETIME(3) NULL,

    UNIQUE INDEX `subscribers_email_key`(`email`),
    UNIQUE INDEX `subscribers_confirm_token_key`(`confirm_token`),
    UNIQUE INDEX `subscribers_unsubscribe_token_key`(`unsubscribe_token`),
    INDEX `subscribers_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4;

CREATE TABLE `newsletters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `sent_at` DATETIME(3) NULL,
    `sent_count` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4;
