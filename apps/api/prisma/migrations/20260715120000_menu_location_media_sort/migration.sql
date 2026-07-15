-- Menu location (header nav vs footer columns) + media ordering
ALTER TABLE `menus` ADD COLUMN `location` VARCHAR(191) NOT NULL DEFAULT 'header';
CREATE INDEX `menus_location_order_idx` ON `menus`(`location`, `order`);
ALTER TABLE `media` ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;
