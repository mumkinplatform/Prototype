-- Migration 011: team_submission + submission_file
-- One submission per (team, hackathon), with multiple uploaded files.
-- TS_SubmittedAt is set when the team confirms the final submission.
-- SF_StoredName is the random on-disk filename; SF_Name is the original.

CREATE TABLE IF NOT EXISTS `team_submission` (
  `TS_ID`                 INT NOT NULL AUTO_INCREMENT,
  `T_ID`                  INT NOT NULL,
  `hackathon_ID`          INT NOT NULL,
  `TS_ProjectName`        VARCHAR(255) NULL,
  `TS_ProjectDescription` TEXT NULL,
  `TS_RepoUrl`            VARCHAR(500) NULL,
  `TS_DemoUrl`            VARCHAR(500) NULL,
  `TS_SubmittedAt`        TIMESTAMP NULL,
  `TS_CreatedAt`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TS_UpdatedAt`          TIMESTAMP NOT NULL
                          DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`TS_ID`),
  UNIQUE KEY `uniq_team_hackathon` (`T_ID`, `hackathon_ID`),
  KEY `idx_team_submission_hack` (`hackathon_ID`),
  CONSTRAINT `fk_team_submission_team`
    FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_team_submission_hack`
    FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `submission_file` (
  `SF_ID`         INT NOT NULL AUTO_INCREMENT,
  `TS_ID`         INT NOT NULL,
  `SF_Name`       VARCHAR(255) NOT NULL,
  `SF_StoredName` VARCHAR(255) NOT NULL,
  `SF_Size`       BIGINT UNSIGNED NOT NULL,
  `SF_MimeType`   VARCHAR(150) NULL,
  `SF_UploadedBy` INT NOT NULL,
  `SF_UploadedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SF_ID`),
  KEY `idx_submission_file_ts` (`TS_ID`),
  CONSTRAINT `fk_submission_file_ts`
    FOREIGN KEY (`TS_ID`) REFERENCES `team_submission` (`TS_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_submission_file_member`
    FOREIGN KEY (`SF_UploadedBy`) REFERENCES `member` (`M_ID`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
