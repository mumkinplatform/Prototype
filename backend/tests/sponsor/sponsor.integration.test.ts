// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests · Sponsor · applyToPackage
//
// 4 سيناريوهات:
//   1) packageId غير موجود  → 404
//   2) بدون JWT             → 401
//   3) packageId سالب       → 400
//   4) تقديم ناجح + حفظ في DB → 201
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { authHeaders } from '../setup';
import { pool } from '../../src/db/pool';
import { seedTestData, cleanupTestData } from './seed';

let packageId: number;
let applicationId: number | null = null;

beforeAll(async () => {
  const seeded = await seedTestData();
  packageId = seeded.packageId;
});

afterAll(async () => {
  await cleanupTestData(applicationId);
});

describe('POST /sponsors/applications · Integration', () => {
  it('returns 404 when package does not exist', async () => {
    const res = await request(app)
      .post('/sponsors/applications')
      .set(authHeaders.sponsor)
      .send({ packageId: 999999 });

    expect(res.status).toBe(404);
  });

  it('returns 401 when no JWT is provided', async () => {
    const res = await request(app)
      .post('/sponsors/applications')
      .send({ packageId: 1 });

    expect(res.status).toBe(401);
  });

  it('returns 400 when packageId is negative', async () => {
    const res = await request(app)
      .post('/sponsors/applications')
      .set(authHeaders.sponsor)
      .send({ packageId: -5 });

    expect(res.status).toBe(400);
  });

  it('sponsor applies successfully and row is saved in DB', async () => {
    const res = await request(app)
      .post('/sponsors/applications')
      .set(authHeaders.sponsor)
      .send({ packageId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');

    applicationId = res.body.id;

    const [rows] = await pool.query(
      'SELECT * FROM sponsor_application WHERE SA_ID = ?',
      [applicationId],
    );
    expect((rows as unknown[]).length).toBe(1);
  });
});
