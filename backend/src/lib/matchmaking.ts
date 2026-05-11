export type Candidate = {
  id: number;
  fullName: string;
  bio: string | null;
  skills: string[];
};

export type SuggestedTeamMember = {
  id: number;
  fullName: string;
  skills: string[];
  matchScore: number;
};

export type SuggestedTeam = {
  id: string;
  score: number;
  members: SuggestedTeamMember[];
  tags: string[];
  reason: string;
};

export type SuggestParams = {
  userSkills: string[];
  candidates: Candidate[];
  teamSize?: number;
  numTeams?: number;
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function computeMatchScore(userSkills: Set<string>, candidateSkills: string[]): number {
  if (candidateSkills.length === 0) return 0;
  const candSet = new Set(candidateSkills.map(normalize));
  let complement = 0;
  let overlap = 0;
  for (const s of candSet) {
    if (userSkills.has(s)) overlap++;
    else complement++;
  }
  const total = candSet.size;
  const complementRatio = complement / total;
  const overlapRatio = userSkills.size > 0 ? overlap / userSkills.size : 0;
  const breadthBonus = Math.min(total / 5, 1);
  const raw = complementRatio * 60 + overlapRatio * 30 + breadthBonus * 10;
  return Math.round(Math.min(raw, 100));
}

function buildReason(teamSkills: string[], userSkills: Set<string>): string {
  const newCount = teamSkills.filter((s) => !userSkills.has(normalize(s))).length;
  if (newCount >= 4) {
    return `فريق متكامل يضيف ${newCount} مهارات تكميلية لمهاراتك، ويغطي ${teamSkills.length} مجالات تقنية مختلفة.`;
  }
  if (newCount >= 2) {
    return `فريق متوازن يجمع بين مهاراتك ومهارات تكميلية في ${teamSkills.length} مجالات.`;
  }
  return `فريق متخصص يشاركك مجالات اهتمامك ويضيف عمقاً في التخصص.`;
}

export function suggestTeams({
  userSkills,
  candidates,
  teamSize = 3,
  numTeams = 3,
}: SuggestParams): SuggestedTeam[] {
  const userSet = new Set(userSkills.map(normalize));

  const scored = candidates
    .map((c) => ({ ...c, matchScore: computeMatchScore(userSet, c.skills) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  if (scored.length === 0) return [];

  const teams: SuggestedTeam[] = [];
  const used = new Set<number>();

  for (let t = 0; t < numTeams; t++) {
    const team: typeof scored = [];
    const teamSkillSet = new Set<string>(userSet);

    while (team.length < teamSize) {
      let best: (typeof scored)[number] | null = null;
      let bestNewSkills = -1;
      let bestScore = -1;

      for (const c of scored) {
        if (used.has(c.id)) continue;
        const newSkills = c.skills.filter((s) => !teamSkillSet.has(normalize(s))).length;
        if (
          newSkills > bestNewSkills ||
          (newSkills === bestNewSkills && c.matchScore > bestScore)
        ) {
          best = c;
          bestNewSkills = newSkills;
          bestScore = c.matchScore;
        }
      }

      if (!best) break;
      team.push(best);
      used.add(best.id);
      best.skills.forEach((s) => teamSkillSet.add(normalize(s)));
    }

    if (team.length === 0) break;

    const teamScore = Math.round(
      team.reduce((sum, m) => sum + m.matchScore, 0) / team.length
    );
    const allSkills = Array.from(new Set(team.flatMap((m) => m.skills)));

    teams.push({
      id: `team-${t + 1}`,
      score: teamScore,
      members: team.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        skills: m.skills,
        matchScore: m.matchScore,
      })),
      tags: allSkills.slice(0, 6),
      reason: buildReason(allSkills, userSet),
    });
  }

  return teams;
}
