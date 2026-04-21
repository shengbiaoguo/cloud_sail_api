-- CreateTable
CREATE TABLE `admin_user` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(100) NOT NULL,
    `role` ENUM('super_admin', 'editor') NOT NULL,
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_user_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `summary` VARCHAR(500) NULL,
    `cover_image` VARCHAR(500) NULL,
    `content` LONGTEXT NOT NULL,
    `seo_title` VARCHAR(255) NULL,
    `seo_keywords` VARCHAR(255) NULL,
    `seo_description` VARCHAR(500) NULL,
    `status` ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
    `published_at` DATETIME(3) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `updated_by` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `news_slug_key`(`slug`),
    INDEX `news_status_published_at_sort_order_idx`(`status`, `published_at`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_study` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `summary` VARCHAR(500) NULL,
    `cover_image` VARCHAR(500) NULL,
    `content` LONGTEXT NOT NULL,
    `client_name` VARCHAR(255) NULL,
    `industry` VARCHAR(100) NULL,
    `project_date` DATE NULL,
    `seo_title` VARCHAR(255) NULL,
    `seo_keywords` VARCHAR(255) NULL,
    `seo_description` VARCHAR(500) NULL,
    `status` ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `updated_by` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `case_study_slug_key`(`slug`),
    INDEX `case_study_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `summary` VARCHAR(500) NULL,
    `cover_image` VARCHAR(500) NULL,
    `content` LONGTEXT NOT NULL,
    `seo_title` VARCHAR(255) NULL,
    `seo_keywords` VARCHAR(255) NULL,
    `seo_description` VARCHAR(500) NULL,
    `status` ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `updated_by` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `service_slug_key`(`slug`),
    INDEX `service_status_sort_order_idx`(`status`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NULL,
    `company` VARCHAR(150) NULL,
    `source_page` VARCHAR(255) NULL,
    `message` VARCHAR(1000) NULL,
    `status` ENUM('pending', 'contacted', 'converted', 'invalid') NOT NULL DEFAULT 'pending',
    `remark` VARCHAR(1000) NULL,
    `assigned_to` BIGINT UNSIGNED NULL,
    `contacted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lead_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_config` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `config_key` VARCHAR(100) NOT NULL,
    `config_value` LONGTEXT NOT NULL,
    `description` VARCHAR(255) NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `site_config_config_key_key`(`config_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upload_file` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `uploaded_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operation_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_user_id` BIGINT UNSIGNED NULL,
    `module` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `target_id` VARCHAR(100) NULL,
    `target_type` VARCHAR(100) NULL,
    `content` VARCHAR(1000) NULL,
    `ip` VARCHAR(64) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operation_log_admin_user_id_created_at_idx`(`admin_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admin_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `admin_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_study` ADD CONSTRAINT `case_study_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admin_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_study` ADD CONSTRAINT `case_study_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `admin_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service` ADD CONSTRAINT `service_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `admin_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service` ADD CONSTRAINT `service_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `admin_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead` ADD CONSTRAINT `lead_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `admin_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `site_config` ADD CONSTRAINT `site_config_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `admin_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `upload_file` ADD CONSTRAINT `upload_file_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `admin_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_log` ADD CONSTRAINT `operation_log_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
