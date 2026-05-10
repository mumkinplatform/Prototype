-- Seed sample notifications for participant id=2

DELETE FROM `notification` WHERE `M_ID` = 2;

INSERT INTO `notification` (`M_ID`, `N_Type`, `N_Title`, `N_Message`, `N_Read`, `N_ActionLabel`, `N_ActionRoute`) VALUES
  (2, 'acceptance', 'تم قبولك في الهاكاثون!', 'تهانينا! تم قبولك في هاكاثون الابتكار السعودي.', 0, 'دخول مساحة العمل', '/participant/workspace'),
  (2, 'team',       'عضو جديد انضم لفريقك',  'انضمت ريم العتيبي لفريقك.',                   0, NULL,                NULL),
  (2, 'deadline',   'موعد التسليم يقترب!',   'تبقى 3 أيام على آخر موعد للتسليم.',            0, 'رفع المشروع',       '/participant/workspace'),
  (2, 'system',     'تحديث المنصة',          'تم تحديث شروط استخدام المنصة.',                1, NULL,                NULL);
