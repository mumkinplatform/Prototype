-- Extend organizer_profile with the structured fields the organizer Profile page
-- already collects in its UI (position, website, commercial register).
-- Mirrors the layout of the sponsor table (S_Position / S_Website / S_CR_Number).

ALTER TABLE `organizer_profile`
  ADD COLUMN `ORG_Position` VARCHAR(150) NULL AFTER `ORG_Name`,
  ADD COLUMN `ORG_Website` VARCHAR(255) NULL AFTER `ORG_Position`,
  ADD COLUMN `ORG_CR_Number` VARCHAR(50) NULL AFTER `ORG_Website`;
