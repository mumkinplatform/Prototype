-- Migration 005: participation_type on applies_hackathon
-- Distinguishes solo registrations from team registrations.
-- Solo = complete registration; team without T_ID = pending team.

ALTER TABLE `applies_hackathon`
  ADD COLUMN `participation_type` ENUM('solo','team') NOT NULL DEFAULT 'team' AFTER `idea_description`;
