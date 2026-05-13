-- Migration 020: add 'submission' to notification.N_Type ENUM.
-- The participant gets an in-app notification when they send their project.
-- Keeping it as a distinct category (not lumped under 'system') lets the
-- frontend style/filter submission notifications separately later.

USE mumkin_db;

ALTER TABLE `notification`
  MODIFY `N_Type` ENUM('acceptance','team','deadline','evaluation','achievement','submission','system')
                  NOT NULL DEFAULT 'system';
