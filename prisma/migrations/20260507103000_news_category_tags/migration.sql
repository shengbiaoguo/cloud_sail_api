-- AlterTable
ALTER TABLE `news`
  ADD COLUMN `category` ENUM('industry_news', 'writing_tips', 'journal_submission', 'academic_service', 'research_integrity') NOT NULL DEFAULT 'industry_news' AFTER `slug`,
  ADD COLUMN `tags` VARCHAR(1000) NULL AFTER `category`;

-- CreateIndex
CREATE INDEX `news_category_status_published_at_sort_order_idx`
  ON `news`(`category`, `status`, `published_at`, `sort_order`);
