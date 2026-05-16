import { describe, it, expect } from 'vitest';
import { suggestTeams, type Candidate } from '../../src/lib/matchmaking';

const mk = (id: number, skills: string[]): Candidate => ({
  id,
  fullName: `User ${id}`,
  bio: null,
  skills,
});

describe('suggestTeams', () => {
  // Data integrity: no candidate is ever placed in two suggested teams at once.
  it('never repeats the same candidate across teams', () => {
    const candidates: Candidate[] = Array.from({ length: 12 }, (_, i) =>
      mk(i + 1, [`Skill${i + 1}`])
    );
    const teams = suggestTeams({
      userSkills: ['Frontend'],
      candidates,
      teamSize: 3,
      numTeams: 3,
    });
    const allIds = teams.flatMap((t) => t.members.map((m) => m.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });
  // Intelligence: pick complementary skills over duplicates of the user's own.
  it('prefers candidates with complementary skills over duplicates of user skills', () => {
    const candidates: Candidate[] = [
      mk(1, ['Frontend']),
      mk(2, ['Backend']),
      mk(3, ['Frontend']),
    ];
    const teams = suggestTeams({
      userSkills: ['Frontend'],
      candidates,
      teamSize: 1,
      numTeams: 1,
    });
    expect(teams).toHaveLength(1);
    expect(teams[0].members[0].id).toBe(2);
  });
});
// Graceful degradation: with fewer candidates than requested, return what we can.
  it('stops early when not enough candidates exist for all teams', () => {
    const candidates = [mk(1, ['Backend']), mk(2, ['Design'])];
    const teams = suggestTeams({
      userSkills: ['Frontend'],
      candidates,
      teamSize: 3,
      numTeams: 3,
    });
    expect(teams.length).toBeLessThanOrEqual(1);
    if (teams.length === 1) {
      expect(teams[0].members.length).toBeLessThanOrEqual(2);
    }
  });
