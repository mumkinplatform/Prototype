-- Migration 026: chat messages for sponsor applications
--
-- يحفظ رسائل التفاوض بين الراعي والمنظم على كل تقديم رعاية.
-- كل رسالة تنتمي لتقديم محدد + ترسل من عضو محدد (راعي أو منظم).

CREATE TABLE IF NOT EXISTS `sponsor_application_message` (
  `SAM_ID` INT NOT NULL AUTO_INCREMENT,
  `SA_ID` INT NOT NULL,
  `M_ID` INT NOT NULL,
  `SAM_Text` TEXT NOT NULL,
  `SAM_CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`SAM_ID`),
  KEY `idx_sam_app_time` (`SA_ID`, `SAM_CreatedAt`),
  KEY `fk_sam_member` (`M_ID`),
  CONSTRAINT `fk_sam_app` FOREIGN KEY (`SA_ID`)
    REFERENCES `sponsor_application` (`SA_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_sam_member` FOREIGN KEY (`M_ID`)
    REFERENCES `member` (`M_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
