-- banner_image on blog categories was never rendered anywhere on the public site — drop it
ALTER TABLE `categories` DROP COLUMN `banner_image`;

-- gallery categories gain the same description field blog categories already have
ALTER TABLE `gallery_categories` ADD COLUMN `description` TEXT NULL;
