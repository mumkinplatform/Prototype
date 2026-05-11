-- ============================================================
-- Migration 013: allow solo participants to submit & be evaluated
-- ============================================================


USE mumkin_db;


ALTER TABLE `team_submission`
  DROP INDEX `uniq_team_hackathon`,
  MODIFY COLUMN `T_ID` INT NULL,
  ADD COLUMN `PM_ID` INT NULL AFTER `T_ID`,
  ADD CONSTRAINT `fk_team_submission_pm`
    FOREIGN KEY (`PM_ID`) REFERENCES `participant` (`PM_ID`) ON DELETE CASCADE,
  ADD UNIQUE KEY `uniq_team_hackathon` (`T_ID`, `hackathon_ID`),
  ADD UNIQUE KEY `uniq_pm_hackathon` (`PM_ID`, `hackathon_ID`),
  ADD CONSTRAINT `chk_submission_owner` CHECK (
    (`T_ID` IS NOT NULL AND `PM_ID` IS NULL) OR
    (`T_ID` IS NULL AND `PM_ID` IS NOT NULL)
  );


ALTER TABLE `evaluation`
  DROP INDEX `uniq_evaluation_judge_team`,
  MODIFY COLUMN `T_ID` INT NULL,
  ADD COLUMN `PM_ID` INT NULL AFTER `T_ID`,
  ADD CONSTRAINT `fk_evaluation_pm`
    FOREIGN KEY (`PM_ID`) REFERENCES `participant` (`PM_ID`) ON DELETE CASCADE,
  ADD UNIQUE KEY `uniq_eval_judge_team` (`HJ_ID`, `T_ID`),
  ADD UNIQUE KEY `uniq_eval_judge_pm` (`HJ_ID`, `PM_ID`),
  ADD CONSTRAINT `chk_evaluation_target` CHECK (
    (`T_ID` IS NOT NULL AND `PM_ID` IS NULL) OR
    (`T_ID` IS NULL AND `PM_ID` IS NOT NULL)
  );
