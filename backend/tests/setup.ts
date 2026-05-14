// Shared test setup — runs once before every test file.
// All teammates use the helpers below. Do not duplicate this logic in role folders.

import 'dotenv/config';
import { afterAll } from 'vitest';
import { signJwt } from '../src/lib/jwt';
import { pool } from '../src/db/pool';

// Pre-baked Authorization headers for each role.
// Use these in integration tests:
//   await request(app).get('/hackathons').set(authHeaders.organizer)
export const authHeaders = {
  organizer:   { Authorization: `Bearer ${signJwt({ memberId: 1, role: 'ORGANIZER'   })}` },
  sponsor:     { Authorization: `Bearer ${signJwt({ memberId: 2, role: 'SPONSOR'     })}` },
  participant: { Authorization: `Bearer ${signJwt({ memberId: 3, role: 'PARTICIPANT' })}` },
};

// Close the DB pool after all tests finish so the test process can exit cleanly.
afterAll(async () => {
  await pool.end().catch(() => { /* pool may already be closed */ });
});
