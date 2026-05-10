-- Migration 010: evaluation tables
-- Judge evaluations of participant teams. Each judge rates one team across
-- multiple criteria, with a text comment.
-- UNIQUE (HJ_ID, T_ID): one evaluation per (judge, team).
-- Total score is computed backend-side as average of criterion scores.

CREATE TABLE IF NOT EXISTS `evaluation` (
  `E_ID`          INT NOT NULL AUTO_INCREMENT,
  `HJ_ID`         INT NOT NULL,
  `T_ID`          INT NOT NULL,
  `hackathon_ID`  INT NOT NULL,
  `E_Comment`     TEXT NULL,
  `E_EvaluatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`E_ID`),
  UNIQUE KEY `uniq_evaluation_judge_team` (`HJ_ID`, `T_ID`),
  KEY `idx_evaluation_team` (`T_ID`),
  KEY `idx_evaluation_hackathon` (`hackathon_ID`),
  CONSTRAINT `fk_evaluation_judge`
    FOREIGN KEY (`HJ_ID`) REFERENCES `hackathon_judge` (`HJ_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_team`
    FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_hackathon`
    FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `evaluation_score` (
  `ES_ID`            INT NOT NULL AUTO_INCREMENT,
  `E_ID`             INT NOT NULL,
  `ES_CriterionName` VARCHAR(150) NOT NULL,
  `ES_Score`         TINYINT UNSIGNED NOT NULL,
  `ES_SortOrder`     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`ES_ID`),
  KEY `idx_evaluation_score_eid` (`E_ID`),
  CONSTRAINT `fk_evaluation_score_eval`
    FOREIGN KEY (`E_ID`) REFERENCES `evaluation` (`E_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
