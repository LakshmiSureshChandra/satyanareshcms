-- Gallery categories gain the same parent/subcategory tree as blog categories
ALTER TABLE `gallery_categories` ADD COLUMN `parent_id` INTEGER NULL;
CREATE INDEX `gallery_categories_parent_id_idx` ON `gallery_categories`(`parent_id`);
ALTER TABLE `gallery_categories` ADD CONSTRAINT `gallery_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `gallery_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
