-- Gallery categories: Gallery -> Category -> Album -> Photos
CREATE TABLE `gallery_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `gallery_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `gallery_albums` ADD COLUMN `category_id` INTEGER NULL;
CREATE INDEX `gallery_albums_category_id_idx` ON `gallery_albums`(`category_id`);
ALTER TABLE `gallery_albums` ADD CONSTRAINT `gallery_albums_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `gallery_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
