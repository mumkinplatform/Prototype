import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool';
import { suggestTeams, Candidate } from '../lib/matchmaking';

interface CandidateRow extends RowDataPacket {
  M_ID: number;
  M_FName: string;
  M_LName: string;
  M_Bio: string | null;
  T_ID: number | null;
  skills: string | null;
}

interface PublishedHackathonRow extends RowDataPacket {
  hackathon_ID: number;
  H_title: string;
}

interface BrowseHackathonRow extends RowDataPacket {
  hackathon_ID: number;
  H_title: string;
  H_description: string | null;
  H_type: string | null;
  H_city: string | null;
  H_full_address: string | null;
  H_StartDate: string | null;
  H_EndDate: string | null;
  H_Registration_EndDate: string | null;
  H_Team_Max: number;
  H_Target_Participants: number | null;
  H_status: string;
  H_Branding: string | null;
  organizer_name: string | null;
}

export const listPublishedHackathons = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<PublishedHackathonRow[]>(
      `SELECT hackathon_ID, H_title
         FROM hackathon
        WHERE H_status IN ('published', 'ongoing')
        ORDER BY hackathon_ID DESC`
    );
    return res.json({ hackathons: rows });
  } catch (err) {
    console.error('listPublishedHackathons error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const browseHackathons = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<BrowseHackathonRow[]>(
      `SELECT
         h.hackathon_ID,
         h.H_title,
         h.H_description,
         h.H_type,
         h.H_city,
         h.H_full_address,
         h.H_StartDate,
         h.H_EndDate,
         h.H_Registration_EndDate,
         h.H_Team_Max,
         h.H_Target_Participants,
         h.H_status,
         h.H_Branding,
         op.ORG_Name AS organizer_name
       FROM hackathon h
       LEFT JOIN organizer_profile op ON op.M_ID = h.HAM_ID
       WHERE h.H_status IN ('published', 'ongoing')
       ORDER BY h.hackathon_ID DESC`
    );
    return res.json({ hackathons: rows });
  } catch (err) {
    console.error('browseHackathons error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

export const suggestTeamsHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  const userId = req.user.memberId;
  const { skills, hackathonId, teamSize, numTeams } = req.body ?? {};

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ error: 'skills array is required' });
  }
  if (skills.some((s: unknown) => typeof s !== 'string' || !s.trim())) {
    return res.status(400).json({ error: 'invalid skills' });
  }

  const hackId = Number(hackathonId);
  if (!Number.isInteger(hackId) || hackId <= 0) {
    return res
      .status(400)
      .json({ error: 'hackathonId is required — matchmaking must be scoped to a specific hackathon' });
  }

  try {
    const sql = `
      SELECT
        m.M_ID,
        m.M_FName,
        m.M_LName,
        m.M_Bio,
        p.T_ID,
        GROUP_CONCAT(ps.P_skills SEPARATOR ',') AS skills
      FROM member m
      INNER JOIN participant p ON p.PM_ID = m.M_ID
      INNER JOIN applies_hackathon ah ON ah.PM_ID = p.PM_ID AND ah.hackathon_ID = ?
      LEFT JOIN participant_skills ps ON ps.PM_ID = p.PM_ID
      WHERE m.M_Type = 'PARTICIPANT'
        AND m.M_ID != ?
        AND m.is_verified = 1
        AND p.T_ID IS NULL
      GROUP BY m.M_ID
    `;
    const params: (number | string)[] = [hackId, userId];

    const [rows] = await pool.query<CandidateRow[]>(sql, params);

    const candidates: Candidate[] = rows
      .map((r) => ({
        id: r.M_ID,
        fullName: `${r.M_FName} ${r.M_LName}`.trim(),
        bio: r.M_Bio,
        skills: r.skills
          ? r.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      }))
      .filter((c) => c.skills.length > 0);

    const teams = suggestTeams({
      userSkills: skills as string[],
      candidates,
      teamSize:
        typeof teamSize === 'number' ? Math.max(2, Math.min(teamSize, 6)) : 3,
      numTeams:
        typeof numTeams === 'number' ? Math.max(1, Math.min(numTeams, 5)) : 3,
    });

    return res.json({
      candidatesCount: candidates.length,
      suggestedTeams: teams,
    });
  } catch (err) {
    console.error('suggestTeams error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};

interface ApplyRow extends RowDataPacket {
  PM_ID: number;
  T_ID: number | null;
}

interface HackathonCapacityRow extends RowDataPacket {
  H_Team_Max: number;
  H_title: string;
}

interface MemberNameRow extends RowDataPacket {
  M_FName: string;
  M_LName: string;
}

export const createTeamFromSuggestion = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  const leaderId = req.user.memberId;
  const { hackathonId, memberIds, teamName } = req.body ?? {};

  const hackId = Number(hackathonId);
  if (!Number.isInteger(hackId) || hackId <= 0) {
    return res.status(400).json({ error: 'hackathonId is required' });
  }
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: 'memberIds array is required' });
  }
  const cleanMemberIds = memberIds
    .map((x: unknown) => Number(x))
    .filter((n) => Number.isInteger(n) && n > 0 && n !== leaderId);

  if (cleanMemberIds.length === 0) {
    return res.status(400).json({ error: 'no valid member ids provided' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [leaderRows] = await conn.query<ApplyRow[]>(
      'SELECT PM_ID, T_ID FROM applies_hackathon WHERE PM_ID = ? AND hackathon_ID = ? FOR UPDATE',
      [leaderId, hackId]
    );
    if (leaderRows.length === 0) {
      await conn.rollback();
      return res.status(403).json({ error: 'يجب التسجيل في الهاكاثون أولاً' });
    }
    if (leaderRows[0].T_ID !== null) {
      await conn.rollback();
      return res.status(409).json({ error: 'أنت بالفعل في فريق لهذا الهاكاثون' });
    }

    const [hackRows] = await conn.query<HackathonCapacityRow[]>(
      'SELECT H_Team_Max, H_title FROM hackathon WHERE hackathon_ID = ?',
      [hackId]
    );
    if (hackRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'الهاكاثون غير موجود' });
    }
    const teamMax = hackRows[0].H_Team_Max ?? 5;

    const placeholders = cleanMemberIds.map(() => '?').join(',');
    const [availableRows] = await conn.query<ApplyRow[]>(
      `SELECT PM_ID, T_ID FROM applies_hackathon
        WHERE hackathon_ID = ?
          AND T_ID IS NULL
          AND PM_ID IN (${placeholders})
        FOR UPDATE`,
      [hackId, ...cleanMemberIds]
    );

    const availableIds = availableRows.map((r) => r.PM_ID);
    if (availableIds.length === 0) {
      await conn.rollback();
      return res.status(409).json({
        error: 'لم يعد أي من المرشّحين متاحاً (انضموا لفرق أخرى).',
      });
    }

    const acceptedIds = availableIds.slice(0, Math.max(0, teamMax - 1));
    const fullTeamIds = [leaderId, ...acceptedIds];

    let finalTeamName = typeof teamName === 'string' && teamName.trim() ? teamName.trim() : '';
    if (!finalTeamName) {
      const [leaderNameRows] = await conn.query<MemberNameRow[]>(
        'SELECT M_FName, M_LName FROM member WHERE M_ID = ?',
        [leaderId]
      );
      const fname = leaderNameRows[0]?.M_FName?.trim() || 'فريق';
      finalTeamName = `فريق ${fname}`;
    }

    const [teamInsert] = await conn.execute<ResultSetHeader>(
      'INSERT INTO team (T_name, T_LeaderId, hackathon_ID) VALUES (?, ?, ?)',
      [finalTeamName, leaderId, hackId]
    );
    const newTeamId = teamInsert.insertId;

    const updatePlaceholders = fullTeamIds.map(() => '?').join(',');
    await conn.execute(
      `UPDATE applies_hackathon
         SET T_ID = ?
       WHERE hackathon_ID = ?
         AND PM_ID IN (${updatePlaceholders})`,
      [newTeamId, hackId, ...fullTeamIds]
    );

    await conn.commit();

    return res.status(201).json({
      teamId: newTeamId,
      teamName: finalTeamName,
      hackathonId: hackId,
      addedMemberIds: acceptedIds,
      skippedMemberIds: cleanMemberIds.filter((id) => !acceptedIds.includes(id)),
    });
  } catch (err) {
    await conn.rollback();
    console.error('createTeamFromSuggestion error:', err);
    return res.status(500).json({
      error: 'internal server error',
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
};
