-- Migration 004: scope teams to hackathons + assign teams to applications
-- Each team belongs to a specific hackathon and has a leader.
-- A registration may optionally link to a team (NULL for solo).

ALTER TABLE `team`
  ADD COLUMN `hackathon_ID` INT NOT NULL,
  ADD COLUMN `T_LeaderId`   INT NOT NULL,
  ADD KEY `idx_team_hackathon` (`hackathon_ID`),
  ADD KEY `idx_team_leader`    (`T_LeaderId`),
  ADD CONSTRAINT `fk_team_hackathon`
    FOREIGN KEY (`hackathon_ID`) REFERENCES `hackathon` (`hackathon_ID`)
    ON DELETE CASCADE,
  ADD CONSTRAINT `fk_team_leader`
    FOREIGN KEY (`T_LeaderId`) REFERENCES `participant` (`PM_ID`)
    ON DELETE CASCADE;

ALTER TABLE `applies_hackathon`
  ADD COLUMN `T_ID` INT NULL,
  ADD KEY `idx_apply_team` (`T_ID`),
  ADD CONSTRAINT `fk_apply_team`
    FOREIGN KEY (`T_ID`) REFERENCES `team` (`T_ID`)
    ON DELETE SET NULL;
