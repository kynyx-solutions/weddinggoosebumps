-- Run once on the beta TiDB database (wedding_goosebumps) BEFORE deploying Sprint 1.
-- Every change only adds a column or table, or widens an existing one; no data is removed.
-- TiDB table names are case-sensitive, so they're written exactly as Prisma created them.

-- Long inquiries (pending from before Sprint 1)
ALTER TABLE `Lead` MODIFY `message` TEXT NULL;
ALTER TABLE `Lead` MODIFY `notes` TEXT NULL;

-- Leads CRM: follow-up reminders
ALTER TABLE `Lead` ADD COLUMN `followUpAt` DATETIME(3) NULL;

-- Post editor: cover image description
ALTER TABLE `BlogPost` ADD COLUMN `coverAlt` VARCHAR(191) NULL;

-- Site Settings: WhatsApp button, address on the Inquire page, longer robots.txt
ALTER TABLE `GlobalSettings` ADD COLUMN `whatsappNumber` VARCHAR(191) NULL;
ALTER TABLE `GlobalSettings` ADD COLUMN `whatsappMessage` TEXT NULL;
ALTER TABLE `GlobalSettings` ADD COLUMN `whatsappEventMessage` TEXT NULL;
ALTER TABLE `GlobalSettings` ADD COLUMN `contactAddress` TEXT NULL;
ALTER TABLE `GlobalSettings` ADD COLUMN `mapUrl` TEXT NULL;
ALTER TABLE `GlobalSettings` ADD COLUMN `showMap` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `GlobalSettings` MODIFY `robotsTxt` TEXT NULL;

-- WhatsApp button click counter (admin dashboard)
CREATE TABLE `WhatsAppClick` (
    `id` VARCHAR(191) NOT NULL,
    `page` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WhatsAppClick_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
