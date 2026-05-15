-- ============================================================
-- Migration 017: evaluation setup (structured criteria, judge
-- assignment per project, organizer visibility toggles)
-- ============================================================
-- الغرض:
--   تجهيز قسم "إدارة المشاريع والتحكيم" بهيكل بيانات منظم:
--     1) جدول معايير تقييم بالأوزان (بدلاً من النص الحر في H_JudgingCriteria)
--     2) ربط كل مشروع (submission) بحكم واحد عند توزيع المشاريع
--     3) إعدادات للمنظم تتحكم بظهور التقييم للمشارك + تاريخ التوزيع
--
-- ملاحظات:
--   * H_JudgingCriteria (text) يبقى موجوداً كنسخة احتياطية للنص القديم،
--     لكن واجهات الإدخال الجديدة (CreateHackathon + HackathonProjects)
--     تكتب على الجدول الجديد فقط.
--   * يحاول السكربت تحويل النصوص القديمة من H_JudgingCriteria إلى صفوف
--     منظمة لو كانت على شكل "اسم: ٢٥٪" أو "اسم: 25%". الباقي يبقى فاضي.
-- ============================================================

USE mumkin_db;

-- 1) Structured criteria per hackathon
CREATE TABLE IF NOT EXISTS `hackathon_evaluation_criteria` (
  `HEC_ID` INT NOT NULL AUTO_INCREMENT,
  `hackathon_ID` INT NOT NULL,
  `HEC_Name` VARCHAR(150) NOT NULL,
  `HEC_Description` TEXT NULL,
  `HEC_Weight` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `HEC_SortOrder` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`HEC_ID`),
  KEY `idx_hec_hackathon` (`hackathon_ID`),
  CONSTRAINT `fk_hec_hackathon` FOREIGN KEY (`hackathon_ID`)
    REFERENCES `hackathon` (`hackathon_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Project → judge assignment (one judge per project per the chosen
--    distribution model — Option B from the spec)
ALTER TABLE `submission`
  ADD COLUMN `assigned_judge_id` INT NULL AFTER `hackathon_ID`,
  ADD CONSTRAINT `fk_submission_judge`
    FOREIGN KEY (`assigned_judge_id`)
    REFERENCES `hackathon_judge` (`HJ_ID`) ON DELETE SET NULL;

-- 3) Organizer-controlled evaluation visibility toggles + a marker
--    for the distribution timestamp (so we know if the organizer
--    pressed "Start Distribution" yet or not).
ALTER TABLE `hackathon`
  ADD COLUMN `H_Show_Evaluations_To_Participants` TINYINT(1) NOT NULL DEFAULT 0
    AFTER `H_Judging_EndDate`,
  ADD COLUMN `H_Show_Evaluation_Notes` TINYINT(1) NOT NULL DEFAULT 0
    AFTER `H_Show_Evaluations_To_Participants`,
  ADD COLUMN `H_Judging_Distributed_At` DATETIME NULL
    AFTER `H_Show_Evaluation_Notes`;

-- 4) Best-effort migration of existing H_JudgingCriteria text into
--    structured rows. Handles formats like:
--      "name: 25%"        "اسم: ٢٥٪"
--      "name 25%"         "اسم (25%)"
--    Lines that don't parse are skipped (organizer re-enters via UI).
--    We don't drop H_JudgingCriteria — it stays as a fallback record.
DROP PROCEDURE IF EXISTS `migrate_judging_criteria_text`;
DELIMITER //
CREATE PROCEDURE `migrate_judging_criteria_text`()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_hackathon_id INT;
  DECLARE v_text TEXT;
  DECLARE v_line VARCHAR(500);
  DECLARE v_remaining TEXT;
  DECLARE v_idx INT;
  DECLARE v_name VARCHAR(150);
  DECLARE v_weight DECIMAL(5,2);
  DECLARE v_sort TINYINT UNSIGNED;
  DECLARE v_percent_pos INT;
  DECLARE v_colon_pos INT;
  DECLARE v_paren_pos INT;
  DECLARE v_weight_str VARCHAR(20);

  DECLARE cur CURSOR FOR
    SELECT hackathon_ID, H_JudgingCriteria
      FROM hackathon
     WHERE H_JudgingCriteria IS NOT NULL
       AND TRIM(H_JudgingCriteria) <> ''
       AND hackathon_ID NOT IN (SELECT DISTINCT hackathon_ID FROM hackathon_evaluation_criteria);
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_hackathon_id, v_text;
    IF done THEN LEAVE read_loop; END IF;

    SET v_remaining = REPLACE(REPLACE(v_text, '\r\n', '\n'), '\r', '\n');
    SET v_sort = 1;

    line_loop: WHILE LENGTH(v_remaining) > 0 DO
      SET v_idx = LOCATE('\n', v_remaining);
      IF v_idx = 0 THEN
        SET v_line = v_remaining;
        SET v_remaining = '';
      ELSE
        SET v_line = SUBSTRING(v_remaining, 1, v_idx - 1);
        SET v_remaining = SUBSTRING(v_remaining, v_idx + 1);
      END IF;

      SET v_line = TRIM(v_line);
      SET v_line = REPLACE(v_line, '•', '');
      SET v_line = REPLACE(v_line, '٪', '%');
      SET v_line = TRIM(v_line);

      SET v_percent_pos = LOCATE('%', v_line);
      IF v_percent_pos > 0 AND LENGTH(v_line) > 2 THEN
        -- Pull the digits immediately before %
        SET v_weight_str = '';
        SET v_idx = v_percent_pos - 1;
        WHILE v_idx > 0 AND SUBSTRING(v_line, v_idx, 1) REGEXP '[0-9.]' DO
          SET v_weight_str = CONCAT(SUBSTRING(v_line, v_idx, 1), v_weight_str);
          SET v_idx = v_idx - 1;
        END WHILE;

        IF v_weight_str <> '' THEN
          SET v_weight = CAST(v_weight_str AS DECIMAL(5,2));
          -- Name = everything before the weight, stripped of ':' '(' ')' etc.
          SET v_name = TRIM(SUBSTRING(v_line, 1, v_idx));
          SET v_name = TRIM(BOTH ':' FROM v_name);
          SET v_name = TRIM(BOTH '(' FROM v_name);
          SET v_name = TRIM(BOTH ')' FROM v_name);
          SET v_name = TRIM(v_name);

          IF LENGTH(v_name) > 0 AND LENGTH(v_name) <= 150 THEN
            INSERT INTO hackathon_evaluation_criteria
              (hackathon_ID, HEC_Name, HEC_Weight, HEC_SortOrder)
              VALUES (v_hackathon_id, v_name, v_weight, v_sort);
            SET v_sort = v_sort + 1;
          END IF;
        END IF;
      END IF;
    END WHILE line_loop;
  END LOOP;
  CLOSE cur;
END //
DELIMITER ;

CALL `migrate_judging_criteria_text`();
DROP PROCEDURE `migrate_judging_criteria_text`;
