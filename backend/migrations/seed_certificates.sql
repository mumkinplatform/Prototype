-- Seed sample certificates for participant id=2 in hackathon id=1

DELETE FROM `certificate` WHERE `M_ID` = 2;

INSERT INTO `certificate` (`M_ID`, `hackathon_ID`, `C_Title`, `C_Type`, `C_Position`, `C_FileUrl`) VALUES
  (2, 1, 'شهادة مشاركة',           'participation', NULL,         NULL),
  (2, 1, 'شهادة المركز الثاني',    'win',           'الثاني',     NULL),
  (2, 1, 'شهادة إكمال التدريب',    'completion',    NULL,         NULL);
