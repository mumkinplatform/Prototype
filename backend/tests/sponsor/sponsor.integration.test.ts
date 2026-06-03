

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
  // System guards
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

  it('returns 404 when package does not exist', async () => {
    const res = await request(app)
      .post('/sponsors/applications')
      .set(authHeaders.sponsor)
      .send({ packageId: 999999 });

    expect(res.status).toBe(404);
  });

  // User behavior
  it('sponsor applies to a new package → saved with status=pending', async () => {
    const res = await request(app)
      .post('/sponsors/applications')
      .set(authHeaders.sponsor)
      .send({ packageId });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    applicationId = res.body.id;
    const [rows] = await pool.query(
      'SELECT SM_ID, SP_ID, SA_Status FROM sponsor_application WHERE SA_ID = ?',
      [applicationId],
    );
    const apps = rows as Array<{ SM_ID: number; SP_ID: number; SA_Status: string }>;
    expect(apps.length).toBe(1);
    expect(apps[0].SP_ID).toBe(packageId);
    expect(apps[0].SA_Status).toBe('pending');
  });
  it('sponsor cannot apply twice to the same package → 409 conflict', async () => {
    const res = await request(app)
      .post('/sponsors/applications')
      .set(authHeaders.sponsor)
      .send({ packageId });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('سبق وقدّمت');
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM sponsor_application WHERE SM_ID = 2',
    );
    const result = rows as Array<{ cnt: number }>;
    expect(Number(result[0].cnt)).toBe(1);
  });
});
