-- Seed sample evaluations for participant id=2 in hackathon id=1.
-- Requires a team for the participant; creates one and attaches two evaluations.

-- 1) Create a team if not already there (leader = participant id=2)
INSERT INTO `team` (`T_name`, `T_LeaderId`, `hackathon_ID`)
SELECT 'فريق المبدعون', 2, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `team` WHERE `T_LeaderId` = 2 AND `hackathon_ID` = 1
);

-- 2) Link participant id=2 to this team
UPDATE `applies_hackathon`
   SET `T_ID` = (SELECT `T_ID` FROM `team` WHERE `T_LeaderId` = 2 AND `hackathon_ID` = 1)
 WHERE `PM_ID` = 2 AND `hackathon_ID` = 1;

-- 3) Clear any prior evaluations for this team
DELETE FROM `evaluation`
 WHERE `T_ID` = (SELECT `T_ID` FROM `team` WHERE `T_LeaderId` = 2 AND `hackathon_ID` = 1);

-- 4) Add a second judge if missing (so we can show two evaluations)
INSERT INTO `hackathon_judge` (`hackathon_ID`, `HJ_FullName`, `HJ_Email`, `HJ_Specialty`, `HJ_InviteStatus`)
SELECT 1, 'سارة الحربي', 'sara.h@example.com', 'منتجات تقنية', 'accepted'
WHERE NOT EXISTS (
  SELECT 1 FROM `hackathon_judge` WHERE `HJ_Email` = 'sara.h@example.com' AND `hackathon_ID` = 1
);

-- 5) Insert two evaluations (one per judge), deterministically ordered
INSERT INTO `evaluation` (`HJ_ID`, `T_ID`, `hackathon_ID`, `E_Comment`)
SELECT
  j.`HJ_ID`,
  (SELECT `T_ID` FROM `team` WHERE `T_LeaderId` = 2 AND `hackathon_ID` = 1),
  1,
  CASE
    WHEN j.`HJ_FullName` = 'علي خالد'
      THEN 'مشروع متميز من ناحية الابتكار. التطبيق العملي للنموذج ممتاز وواجهة المستخدم سلسة.'
    ELSE 'عمل جيد في الجانب التقني. أقترح تحسين طريقة عرض البيانات وإضافة أمثلة حية.'
  END
  FROM `hackathon_judge` j
 WHERE j.`hackathon_ID` = 1
   AND j.`HJ_FullName` IN ('علي خالد', 'سارة الحربي');

-- 6) Criterion scores per evaluation
-- Evaluation by Ali
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'الابتكار',         92, 1 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'علي خالد' AND e.`hackathon_ID` = 1;
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'الجدوى التقنية',   85, 2 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'علي خالد' AND e.`hackathon_ID` = 1;
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'جودة العرض',       90, 3 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'علي خالد' AND e.`hackathon_ID` = 1;
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'التأثير المجتمعي',  84, 4 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'علي خالد' AND e.`hackathon_ID` = 1;

-- Evaluation by Sara
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'الابتكار',         80, 1 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'سارة الحربي' AND e.`hackathon_ID` = 1;
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'الجدوى التقنية',   88, 2 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'سارة الحربي' AND e.`hackathon_ID` = 1;
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'جودة العرض',       78, 3 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'سارة الحربي' AND e.`hackathon_ID` = 1;
INSERT INTO `evaluation_score` (`E_ID`, `ES_CriterionName`, `ES_Score`, `ES_SortOrder`)
SELECT e.`E_ID`, 'التأثير المجتمعي',  82, 4 FROM `evaluation` e
  JOIN `hackathon_judge` j ON j.`HJ_ID` = e.`HJ_ID`
 WHERE j.`HJ_FullName` = 'سارة الحربي' AND e.`hackathon_ID` = 1;
