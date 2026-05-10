-- Seed sample sessions for hackathon id=1.
-- Dates span all statuses: completed / live / soon / scheduled.

DELETE FROM `session` WHERE `hackathon_ID` = 1;

INSERT INTO `session` (`hackathon_ID`, `S_Title`, `S_Description`, `S_Type`, `S_StartAt`, `S_DurationMinutes`, `S_Link`) VALUES
  -- Completed (a week ago)
  (1, 'جلسة الافتتاح والتوجيه',
      'جلسة ترحيبية وتوجيهية للمشاركين مع شرح قواعد المسابقة والجدول الزمني.',
      'zoom',
      DATE_SUB(NOW(), INTERVAL 7 DAY),
      60,
      'https://zoom.us/j/123456789'),

  -- Live now (started 30 min ago, runs 90 min)
  (1, 'ورشة عملية: تطبيقات الذكاء الاصطناعي',
      'ورشة عملية لتعلم أساسيات التعلم الآلي وتطبيقاتها العملية.',
      'zoom',
      DATE_SUB(NOW(), INTERVAL 30 MINUTE),
      90,
      'https://zoom.us/j/987654321'),

  -- Soon (within 12 hours)
  (1, 'جلسة الإرشاد مع الخبراء',
      'جلسة استشارية مفتوحة مع خبراء لمساعدة الفرق وحل التحديات.',
      'teams',
      DATE_ADD(NOW(), INTERVAL 12 HOUR),
      180,
      'https://teams.microsoft.com/l/meetup-join/123'),

  -- Scheduled (a week from now)
  (1, 'العرض التقديمي النهائي',
      'جلسة العروض التقديمية النهائية أمام لجنة التحكيم.',
      'zoom',
      DATE_ADD(NOW(), INTERVAL 7 DAY),
      240,
      'https://zoom.us/j/456789123');
