-- Migration 012: team_message table
-- Team chat inside the workspace. Index on (T_ID, TM_CreatedAt) for fast chronological reads.

CREATE TABLE IF NOT EXISTS `team_message` (
  `TM_ID`        INT NOT NULL AUTO_INCREMENT,
  `T_ID`         INT NOT NULL,
  `M_ID`         INT NOT NULL,
  `TM_Text`      TEXT NOT NULL,
  `TM_CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TM_ID`),
  KEY `idx_team_message_team_time` (`T_ID`, `TM_CreatedAt`),
  CONSTRAINT `fk_team_message_team`
    FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_team_message_member`
    FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
