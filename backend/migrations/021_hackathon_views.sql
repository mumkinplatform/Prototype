-- Migration 017: H_views column for hackathon view tracking
--
-- Adds a counter that increments each time a sponsor opens a hackathon's
-- details page. Used by the sponsor opportunities flow.

ALTER TABLE `hackathon`
  ADD COLUMN `H_views` INT UNSIGNED NOT NULL DEFAULT 0
  AFTER `H_status`;
