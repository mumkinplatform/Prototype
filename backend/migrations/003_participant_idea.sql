-- Migration 003: idea fields on applies_hackathon
-- Each registration must include an idea title and description.

ALTER TABLE `applies_hackathon`
  ADD COLUMN `idea_title`       VARCHAR(200) NOT NULL,
  ADD COLUMN `idea_description` TEXT         NOT NULL,
  ADD COLUMN `applied_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP;
