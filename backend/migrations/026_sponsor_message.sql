-- Migration 026: sponsor_message table
-- Real chat between the organizer and the sponsor, scoped to a single
-- sponsor_application (SA_ID). Mirrors the team_message design from
-- migration 012 — both sides can send/read; ordering by SM_CreatedAt
-- with the composite index for fast chronological reads.
--
-- Why scope by SA_ID and not (hackathon, sponsor): a sponsor can in theory
-- apply, get rejected, and re-apply later. Each application is its own
-- conversation thread so context never leaks across attempts.

CREATE TABLE IF NOT EXISTS `sponsor_message` (
  `SM_MsgID`     INT NOT NULL AUTO_INCREMENT,
  `SA_ID`        INT NOT NULL,
  `M_ID`         INT NOT NULL,
  `SM_Text`      TEXT NOT NULL,
  `SM_CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SM_MsgID`),
  KEY `idx_sponsor_message_app_time` (`SA_ID`, `SM_CreatedAt`),
  CONSTRAINT `fk_sponsor_message_app`
    FOREIGN KEY (`SA_ID`) REFERENCES `sponsor_application` (`SA_ID`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_sponsor_message_member`
    FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
