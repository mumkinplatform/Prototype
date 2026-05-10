-- Migration 009: session table
-- Live hackathon sessions (kickoff, workshops, mentoring, final pitches).
-- Status (upcoming/live/completed) is computed from S_StartAt + duration, not stored.

CREATE TABLE IF NOT EXISTS `session` (
  `S_ID`              INT NOT NULL AUTO_INCREMENT,
  `hackathon_ID`      INT NOT NULL,
  `S_Title`           VARCHAR(255) NOT NULL,
  `S_Description`     TEXT NULL,
  `S_Type`            ENUM('zoom','teams','meet','other')
                      NOT NULL DEFAULT 'zoom',
  `S_StartAt`         DATETIME NOT NULL,
  `S_DurationMinutes` SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  `S_Link`            VARCHAR(500) NULL,
  `S_CreatedAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`S_ID`),
  KEY `idx_session_hackathon` (`hackathon_ID`),
  KEY `idx_session_start` (`hackathon_ID`, `S_StartAt`),
  CONSTRAINT `fk_session_hackathon`
    FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
