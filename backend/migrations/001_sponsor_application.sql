-- Migration 001: sponsor_application table
--
-- Drops legacy tables (package, applies_package) that referenced an unused
-- design, and creates sponsor_application linking sponsor to sponsor_package
-- with pending/accepted/rejected status.

DROP TABLE IF EXISTS `applies_package`;
DROP TABLE IF EXISTS `package`;

CREATE TABLE IF NOT EXISTS `sponsor_application` (
  `SA_ID`        INT NOT NULL AUTO_INCREMENT,
  `SM_ID`        INT NOT NULL,
  `SP_ID`        INT NOT NULL,
  `SA_Status`    ENUM('pending','accepted','rejected')
                 NOT NULL DEFAULT 'pending',
  `SA_AppliedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SA_ID`),
  UNIQUE KEY `uk_sponsor_package` (`SM_ID`, `SP_ID`),
  KEY `idx_sa_sponsor` (`SM_ID`),
  KEY `idx_sa_package` (`SP_ID`),
  CONSTRAINT `fk_sa_sponsor`
    FOREIGN KEY (`SM_ID`) REFERENCES `sponsor` (`SM_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_sa_package`
    FOREIGN KEY (`SP_ID`) REFERENCES `sponsor_package` (`SP_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
