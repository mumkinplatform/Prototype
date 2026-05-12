// Apply migration 019: team_invitation table (from Jouri's pull). Run once
// after pulling the team's branch so the participant team-invitation flow
// has its backing table.
import { pool } from '../src/db/pool';

async function main() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS team_invitation (
       TI_ID INT NOT NULL AUTO_INCREMENT,
       T_ID INT NOT NULL,
       TI_Email VARCHAR(255) NOT NULL,
       TI_Token VARCHAR(64) NOT NULL,
       TI_Status ENUM('pending','accepted','declined','expired')
                 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
       TI_InvitedBy INT NOT NULL,
       TI_InvitedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       TI_ExpiresAt DATETIME NULL,
       TI_RespondedAt DATETIME NULL,
       PRIMARY KEY (TI_ID),
       UNIQUE KEY uk_team_invitation_token (TI_Token),
       UNIQUE KEY uk_team_invitation_team_email (T_ID, TI_Email),
       KEY idx_team_invitation_email (TI_Email),
       KEY idx_team_invitation_status (TI_Status),
       CONSTRAINT fk_team_invitation_team
         FOREIGN KEY (T_ID) REFERENCES team (T_ID) ON DELETE CASCADE,
       CONSTRAINT fk_team_invitation_inviter
         FOREIGN KEY (TI_InvitedBy) REFERENCES member (M_ID) ON DELETE CASCADE
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  console.log('Migration 019 applied — team_invitation table ready.');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
