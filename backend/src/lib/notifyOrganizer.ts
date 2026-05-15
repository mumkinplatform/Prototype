// Helper: insert an in-platform notification for the hackathon's owner organizer
// the moment an event happens. Used by controllers that handle registrations,
// sponsor applications, evaluations, contract steps, etc.
//
// Failure to insert never bubbles up — a notification is a side-effect, the
// original operation (the participant registering, the sponsor signing, etc.)
// must not break because the notification table is unhappy.

import { pool } from '../db/pool';
import { RowDataPacket } from 'mysql2';

type NotificationType =
  | 'team'
  | 'system'
  | 'deadline'
  | 'evaluation'
  | 'acceptance'
  | 'achievement'
  | 'submission';

export interface OrganizerNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  actionLabel: string;
  actionRoute: string;
}

export async function notifyHackathonOrganizer(
  hackathonId: number,
  payload: OrganizerNotificationPayload,
): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT HAM_ID FROM hackathon WHERE hackathon_ID = ? LIMIT 1',
      [hackathonId],
    );
    const memberId = rows[0]?.HAM_ID;
    if (!memberId) return;

    await pool.execute(
      `INSERT INTO notification
         (M_ID, N_Type, N_Title, N_Message, N_ActionLabel, N_ActionRoute)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [memberId, payload.type, payload.title, payload.message, payload.actionLabel, payload.actionRoute],
    );
  } catch (err) {
    console.error('[notifyHackathonOrganizer] failed:', err);
  }
}
