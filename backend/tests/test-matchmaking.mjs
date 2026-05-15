#!/usr/bin/env node
import process from 'node:process';
const { argv, env } = process;

const BASE = env.BACKEND_URL || 'http://localhost:3000';
const TOKEN = argv[2] || env.AUTH_TOKEN || '';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

const tests = [];
const skipped = [];

function test(name, fn, opts = {}) {
  tests.push({ name, fn, requiresAuth: opts.requiresAuth || false });
}

async function request(method, path, body, useAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function assertStatus(actual, expected, ctx = '') {
  if (actual !== expected) {
    throw new Error(`expected status ${expected}, got ${actual}${ctx ? ` (${ctx})` : ''}`);
  }
}

function assertHasKey(obj, key) {
  if (!obj || !(key in obj)) {
    throw new Error(`expected response to have key "${key}", got: ${JSON.stringify(obj)}`);
  }
}

// ─── Tests: POST /matchmaking/suggest-teams ─────────────────────────────────
test('suggest-teams rejects request without auth token (401)', async () => {
  const { status } = await request('POST', '/matchmaking/suggest-teams', {
    skills: ['Frontend'],
    hackathonId: 1,
  });
  assertStatus(status, 401);
});

test('suggest-teams rejects empty skills array (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/suggest-teams', {
    skills: [],
    hackathonId: 1,
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('suggest-teams rejects non-string skill values (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/suggest-teams', {
    skills: ['Frontend', 123, null],
    hackathonId: 1,
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('suggest-teams rejects missing hackathonId (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/suggest-teams', {
    skills: ['Frontend'],
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('suggest-teams rejects negative hackathonId (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/suggest-teams', {
    skills: ['Frontend'],
    hackathonId: -5,
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('suggest-teams rejects non-numeric hackathonId (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/suggest-teams', {
    skills: ['Frontend'],
    hackathonId: 'abc',
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('suggest-teams accepts valid request and returns suggestedTeams (200)', async () => {
  const { status, data } = await request('POST', '/matchmaking/suggest-teams', {
    skills: ['Frontend', 'Backend'],
    hackathonId: 5,
  }, true);
  assertStatus(status, 200);
  assertHasKey(data, 'suggestedTeams');
  assertHasKey(data, 'candidatesCount');
  if (!Array.isArray(data.suggestedTeams)) {
    throw new Error('suggestedTeams should be an array');
  }
}, { requiresAuth: true });

// ─── Tests: POST /matchmaking/create-team-from-suggestion ───────────────────
test('create-team rejects request without auth token (401)', async () => {
  const { status } = await request('POST', '/matchmaking/create-team-from-suggestion', {
    hackathonId: 1,
    memberIds: [2, 3],
  });
  assertStatus(status, 401);
});

test('create-team rejects missing hackathonId (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/create-team-from-suggestion', {
    memberIds: [2, 3],
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('create-team rejects empty memberIds array (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/create-team-from-suggestion', {
    hackathonId: 5,
    memberIds: [],
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('create-team rejects all-invalid memberIds (400)', async () => {
  const { status, data } = await request('POST', '/matchmaking/create-team-from-suggestion', {
    hackathonId: 5,
    memberIds: ['abc', -1, null, 0],
  }, true);
  assertStatus(status, 400);
  assertHasKey(data, 'error');
}, { requiresAuth: true });

test('create-team rejects non-existent hackathon with 403 or 404', async () => {
  const { status } = await request('POST', '/matchmaking/create-team-from-suggestion', {
    hackathonId: 999999,
    memberIds: [2, 3],
  }, true);
  if (status !== 403 && status !== 404) {
    throw new Error(`expected 403 or 404, got ${status}`);
  }
}, { requiresAuth: true });

// ─── Tests: GET /matchmaking/browse-hackathons ──────────────────────────────
test('browse-hackathons rejects request without auth token (401)', async () => {
  const { status } = await request('GET', '/matchmaking/browse-hackathons');
  assertStatus(status, 401);
});

test('browse-hackathons returns hackathons list with valid token (200)', async () => {
  const { status, data } = await request('GET', '/matchmaking/browse-hackathons', undefined, true);
  assertStatus(status, 200);
  assertHasKey(data, 'hackathons');
  if (!Array.isArray(data.hackathons)) {
    throw new Error('hackathons should be an array');
  }
}, { requiresAuth: true });

// ─── Runner ─────────────────────────────────────────────────────────────────
async function run() {
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║       Smart Matchmaking — Test Suite                     ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}`);
  console.log(`${CYAN}Backend:${RESET} ${BASE}`);
  console.log(`${CYAN}Auth token:${RESET} ${TOKEN ? `${TOKEN.slice(0, 12)}…(${TOKEN.length} chars)` : `${YELLOW}not provided — authenticated tests will be skipped${RESET}`}\n`);

  let passed = 0, failed = 0;
  const failures = [];

  for (const t of tests) {
    if (t.requiresAuth && !TOKEN) {
      console.log(`${YELLOW}⊘ SKIP${RESET}  ${t.name}`);
      skipped.push(t.name);
      continue;
    }
    try {
      await t.fn();
      console.log(`${GREEN}✓ PASS${RESET}  ${t.name}`);
      passed++;
    } catch (e) {
      console.log(`${RED}✗ FAIL${RESET}  ${t.name}`);
      console.log(`        ${RED}${e.message}${RESET}`);
      failures.push({ name: t.name, error: e.message });
      failed++;
    }
  }

  console.log();
  console.log(`${BOLD}─────────────────────────────────────────────────────────────${RESET}`);
  console.log(`${BOLD}Total:${RESET}   ${tests.length}`);
  console.log(`${GREEN}Passed:${RESET}  ${passed}`);
  console.log(`${RED}Failed:${RESET}  ${failed}`);
  if (skipped.length > 0) {
    console.log(`${YELLOW}Skipped:${RESET} ${skipped.length} (no token)`);
  }
  console.log(`${BOLD}─────────────────────────────────────────────────────────────${RESET}`);

  if (failed === 0 && skipped.length === 0) {
    console.log(`\n${GREEN}${BOLD}✓ All tests passed!${RESET}\n`);
  } else if (failed === 0) {
    console.log(`\n${YELLOW}${BOLD}⚠ Some tests skipped. Run with a token to test everything:${RESET}`);
    console.log(`  node backend/tests/test-matchmaking.mjs <YOUR_TOKEN>\n`);
  } else {
    console.log(`\n${RED}${BOLD}✗ Some tests failed.${RESET}\n`);
  }

  process.exitCode = failed > 0 ? 1 : 0;
}

run().catch((err) => {
  console.error(`${RED}Runner crashed:${RESET}`, err);
  process.exitCode = 2;
});
