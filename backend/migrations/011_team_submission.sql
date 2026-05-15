-- Migration 011: submission + submission_file
-- One submission per (team OR solo participant, hackathon), with multiple
-- uploaded files. TS_SubmittedAt is set when the owner confirms the final
-- submission. SF_StoredName is the random on-disk filename; SF_Name is the
-- original.
--
-- Owner is either a team (T_ID) OR a solo participant (PM_ID), enforced by
-- chk_submission_owner. Filename kept as 011_team_submission.sql for git
-- history; the table is `submission` (renamed from `team_submission`).
-- Column prefix `TS_` stays as-is for compatibility with existing rows.

CREATE TABLE IF NOT EXISTS `submission` (
  `TS_ID`                 INT NOT NULL AUTO_INCREMENT,
  `T_ID`                  INT NULL,
  `PM_ID`                 INT NULL,
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
  UNIQUE KEY `uniq_pm_hackathon`   (`PM_ID`, `hackathon_ID`),
  KEY `idx_submission_hack` (`hackathon_ID`),
  CONSTRAINT `fk_submission_team`
    FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_submission_pm`
    FOREIGN KEY (`PM_ID`) REFERENCES `participant` (`PM_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_submission_hack`
    FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_submission_owner` CHECK (
    (`T_ID` IS NOT NULL AND `PM_ID` IS NULL) OR
    (`T_ID` IS NULL AND `PM_ID` IS NOT NULL)
  )
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
    FOREIGN KEY (`TS_ID`) REFERENCES `submission` (`TS_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_submission_file_member`
    FOREIGN KEY (`SF_UploadedBy`) REFERENCES `member` (`M_ID`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;