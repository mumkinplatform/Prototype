import { describe, it, expect } from 'vitest';
import {
  effectiveInviteStatus,
  isValidEmailFormat,
  cleanInviteEmails,
  type TeamInviteLookupRow,
} from '../../src/controllers/participant.controller';

// Builds an invite row with only the fields effectiveInviteStatus reads
// (TI_Status, TI_ExpiresAt, hackathon_reg_end); the rest are placeholders.
function makeInvite(overrides: Partial<TeamInviteLookupRow>): TeamInviteLookupRow {
  return {
    TI_ID: 1,
    TI_Email: 'test@example.com',
    TI_Status: 'pending',
    TI_ExpiresAt: null,
    TI_RespondedAt: null,
    T_ID: 1,
    T_name: 'Team',
    leader_M_ID: 1,
    leader_first: 'L',
    leader_last: 'L',
    hackathon_ID: 1,
    hackathon_title: 'Hack',
    hackathon_reg_end: null,
    idea_title: null,
    idea_description: null,
    H_Team_Max: 5,
    ...overrides,
  } as TeamInviteLookupRow;
}

describe('effectiveInviteStatus', () => {
  const now = new Date('2026-05-15T12:00:00Z').getTime();

  it('returns "pending" when a pending invite has not yet expired', () => {
    const invite = makeInvite({
      TI_Status: 'pending',
      TI_ExpiresAt: new Date('2026-05-20T00:00:00Z'),
    });
    expect(effectiveInviteStatus(invite, now)).toBe('pending');
  });

  it('returns "expired" when a pending invite\'s expiry has passed', () => {
    const invite = makeInvite({
      TI_Status: 'pending',
      TI_ExpiresAt: new Date('2026-05-10T00:00:00Z'),
    });
    expect(effectiveInviteStatus(invite, now)).toBe('expired');
  });

  it('preserves a non-pending status regardless of dates', () => {
    // Once the invitee responds, the recorded status wins — the time-based
    // expiry only overrides while the invite is still pending.
    const invite = makeInvite({
      TI_Status: 'accepted',
      TI_ExpiresAt: new Date('2020-01-01T00:00:00Z'),
    });
    expect(effectiveInviteStatus(invite, now)).toBe('accepted');
  });
});

// These two helpers are the input gate before invite data hits the DB.
// DB-dependent checks (self-invite, already-registered) live in
// validateManualTeamInvites and are covered by the integration test.

describe('isValidEmailFormat', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmailFormat('user@example.com')).toBe(true);
    expect(isValidEmailFormat('first.last@sub.domain.sa')).toBe(true);
  });

  it('rejects an address missing @', () => {
    expect(isValidEmailFormat('userexample.com')).toBe(false);
  });

  it('rejects an address missing a TLD', () => {
    expect(isValidEmailFormat('user@example')).toBe(false);
  });

  it('rejects whitespace inside the address', () => {
    expect(isValidEmailFormat('user @example.com')).toBe(false);
    expect(isValidEmailFormat('user@example .com')).toBe(false);
  });
});

describe('cleanInviteEmails', () => {
  // Dedup is the critical guarantee — one address can't take two team
  // slots. The single scenario combines casing AND surrounding whitespace
  // so no transformation that could hide a duplicate slips through.
  it('treats the same address with different casing/whitespace as one entry', () => {
    expect(cleanInviteEmails(['a@b.com', 'A@B.COM', 'a@b.com ']))
      .toEqual(['a@b.com']);
  });
});
