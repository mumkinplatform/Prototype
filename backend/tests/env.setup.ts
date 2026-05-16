// Loads .env.test BEFORE any module that reads process.env (notably
// src/config/env.ts, which constructs the DB pool against process.env.DB_NAME).
//
// Vitest runs files in `setupFiles` in order as separate modules, so by putting
// this file first the test database name is in process.env by the time
// tests/setup.ts imports src/db/pool — which is what makes the pool connect to
// `mumkin_test` instead of the dev database.

import { config } from 'dotenv';
import path from 'path';

config({
  path: path.resolve(__dirname, '..', '.env.test'),
  override: true,
});
