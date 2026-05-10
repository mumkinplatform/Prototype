-- Migration 006: hackathon_skill table
-- Required technical skills per hackathon, shown on detail/listing pages.
-- Composite PK (hackathon_ID, skill_name) prevents duplicates.

CREATE TABLE IF NOT EXISTS `hackathon_skill` (
  `hackathon_ID` INT NOT NULL,
  `skill_name`   VARCHAR(100) NOT NULL,
  PRIMARY KEY (`hackathon_ID`, `skill_name`),
  CONSTRAINT `fk_hackathon_skill_hackathon`
    FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
