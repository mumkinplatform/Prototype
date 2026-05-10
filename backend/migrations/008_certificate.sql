-- Migration 008: certificate table
-- Certificates issued to participants (participation/win/completion).
-- UNIQUE (M_ID, hackathon_ID, C_Type) prevents duplicates of the same type per participant per hackathon.

CREATE TABLE IF NOT EXISTS `certificate` (
  `C_ID`         INT NOT NULL AUTO_INCREMENT,
  `M_ID`         INT NOT NULL,
  `hackathon_ID` INT NOT NULL,
  `C_Title`      VARCHAR(255) NOT NULL,
  `C_Type`       ENUM('participation','win','completion')
                 NOT NULL DEFAULT 'participation',
  `C_Position`   VARCHAR(50) NULL,
  `C_FileUrl`    VARCHAR(500) NULL,
  `C_IssuedAt`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`C_ID`),
  KEY `idx_certificate_member` (`M_ID`),
  UNIQUE KEY `uniq_certificate_member_hack_type` (`M_ID`, `hackathon_ID`, `C_Type`),
  CONSTRAINT `fk_certificate_member`
    FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_certificate_hackathon`
    FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
