-- Migration 002: participant_profile fields
-- Adds profile columns shared by all roles (member) plus participant-only columns.

-- Shared columns on member
ALTER TABLE `member`
  ADD COLUMN `phone`      VARCHAR(20)  NULL AFTER `M_Bio`,
  ADD COLUMN `city`       VARCHAR(100) NULL AFTER `phone`,
  ADD COLUMN `avatar_url` VARCHAR(500) NULL AFTER `city`;

-- Participant-only columns
ALTER TABLE `participant`
  ADD COLUMN `university` VARCHAR(150) NULL AFTER `T_ID`,
  ADD COLUMN `major`      VARCHAR(150) NULL AFTER `university`,
  ADD COLUMN `study_year` VARCHAR(50)  NULL AFTER `major`;
