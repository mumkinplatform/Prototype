-- ============================================================
-- Migration 017: team_invitation
-- ============================================================
-- الغرض:
--   حفظ دعوات أعضاء الفريق الي يرسلها قائد الفريق عبر الإيميل
--   (manual team formation method). كل دعوة تربط بين فريق محدد
--   وإيميل مدعو معيّن، مع رمز سرّي (token) لرابط القبول.
--
-- الحقول:
--   TI_ID            مفتاح أساسي
--   T_ID             الفريق الي ينتمي له المدعو (FK → team)
--   TI_Email         إيميل المدعو (يجب يطابق member.M_Email لمشارك)
--   TI_Token         رمز سرّي فريد للرابط (64 char)
--   TI_Status        pending / accepted / declined / expired
--   TI_InvitedBy     القائد الي أرسل الدعوة (FK → member)
--   TI_InvitedAt     وقت الإرسال
--   TI_ExpiresAt     آخر موعد للقبول = MIN(NOW()+7d, H_Registration_EndDate)
--   TI_RespondedAt   وقت القبول/الرفض (NULL لو pending)
--
-- القيود:
--   * UNIQUE(T_ID, TI_Email)   — منع تكرار دعوة لنفس الإيميل في نفس الفريق
--   * UNIQUE(TI_Token)         — كل دعوة برمز فريد
--   * ON DELETE CASCADE         — لو انحذف الفريق، تنحذف الدعوات معه
-- ============================================================

USE mumkin_db;

CREATE TABLE `team_invitation` (
  `TI_ID` INT NOT NULL AUTO_INCREMENT,
  `T_ID` INT NOT NULL,
  `TI_Email` VARCHAR(255) NOT NULL,
  `TI_Token` VARCHAR(64) NOT NULL,
  `TI_Status` ENUM('pending','accepted','declined','expired')
              COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `TI_InvitedBy` INT NOT NULL,
  `TI_InvitedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TI_ExpiresAt` DATETIME NULL,
  `TI_RespondedAt` DATETIME NULL,
  PRIMARY KEY (`TI_ID`),
  UNIQUE KEY `uk_team_invitation_token` (`TI_Token`),
  UNIQUE KEY `uk_team_invitation_team_email` (`T_ID`, `TI_Email`),
  KEY `idx_team_invitation_email` (`TI_Email`),
  KEY `idx_team_invitation_status` (`TI_Status`),
  CONSTRAINT `fk_team_invitation_team`
    FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_invitation_inviter`
    FOREIGN KEY (`TI_InvitedBy`) REFERENCES `member` (`M_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
