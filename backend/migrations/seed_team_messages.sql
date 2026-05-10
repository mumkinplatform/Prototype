-- Seed sample team chat messages for team id=1.
-- Uses M_ID=2 as the sole sender if no other members exist.

DELETE FROM `team_message` WHERE `T_ID` = 1;

INSERT INTO `team_message` (`T_ID`, `M_ID`, `TM_Text`, `TM_CreatedAt`) VALUES
  (1, 2, 'مرحباً بالفريق! أنا متحمّس للبدء.',                DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (1, 2, 'فكّرت نبدأ بتقسيم المهام، إيش رأيكم؟',            DATE_SUB(NOW(), INTERVAL 110 MINUTE)),
  (1, 2, 'أنا بقدر أمسك جزء الـ backend.',                  DATE_SUB(NOW(), INTERVAL 90 MINUTE)),
  (1, 2, 'محتاجين أحد يصمّم الواجهة.',                       DATE_SUB(NOW(), INTERVAL 30 MINUTE));
