-- Gallery: albums (a "post" that is a collection of photos) + their photos
CREATE TABLE `gallery_albums` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `cover_image` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    UNIQUE INDEX `gallery_albums_slug_key`(`slug`),
    INDEX `gallery_albums_status_published_at_idx`(`status`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gallery_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `album_id` INTEGER NOT NULL,
    `file` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `gallery_photos_album_id_sort_order_idx`(`album_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `gallery_photos` ADD CONSTRAINT `gallery_photos_album_id_fkey` FOREIGN KEY (`album_id`) REFERENCES `gallery_albums`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
