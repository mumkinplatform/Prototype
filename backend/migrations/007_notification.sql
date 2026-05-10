-- Migration 007: notification table
-- User notifications (acceptance, evaluation, deadline, etc.).
-- Index on (M_ID, N_Read) speeds up unread-count queries.

CREATE TABLE IF NOT EXISTS `notification` (
  `N_ID`          INT NOT NULL AUTO_INCREMENT,
  `M_ID`          INT NOT NULL,
  `N_Type`        ENUM('acceptance','team','deadline','evaluation','achievement','system')
                  NOT NULL DEFAULT 'system',
  `N_Title`       VARCHAR(255) NOT NULL,
  `N_Message`     TEXT NOT NULL,
  `N_Read`        TINYINT(1) NOT NULL DEFAULT 0,
  `N_ActionLabel` VARCHAR(100) NULL,
  `N_ActionRoute` VARCHAR(255) NULL,
  `N_CreatedAt`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`N_ID`),
  KEY `idx_notification_member`      (`M_ID`),
  KEY `idx_notification_member_read` (`M_ID`, `N_Read`),
  CONSTRAINT `fk_notification_member`
    FOREIGN KEY (`M_ID`) REFERENCES `member` (`M_ID`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
