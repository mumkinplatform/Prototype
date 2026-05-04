import { Request, Response } from 'express';
import { pingDb } from '../db/pool';

export const getDbHealth = async (_req: Request, res: Response) => {
  try {
    await pingDb();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'unreachable',
      message: err instanceof Error ? err.message : 'unknown error',
    });
  }
};
