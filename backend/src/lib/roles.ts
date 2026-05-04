export type FrontendRole = 'admin' | 'sponsor' | 'participant';
export type DbRole = 'ORGANIZER' | 'SPONSOR' | 'PARTICIPANT';

const FRONTEND_TO_DB: Record<FrontendRole, DbRole> = {
  admin: 'ORGANIZER',
  sponsor: 'SPONSOR',
  participant: 'PARTICIPANT',
};

const DB_TO_FRONTEND: Record<DbRole, FrontendRole> = {
  ORGANIZER: 'admin',
  SPONSOR: 'sponsor',
  PARTICIPANT: 'participant',
};

export function toDbRole(role: string): DbRole | null {
  return FRONTEND_TO_DB[role as FrontendRole] ?? null;
}

export function toFrontendRole(role: DbRole): FrontendRole {
  return DB_TO_FRONTEND[role];
}
