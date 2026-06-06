import { beforeAll, afterAll } from 'vitest';
import express from 'express';
import authRouter from '../routes/auth.js';
import classesRouter from '../routes/classes.js';
import studentsRouter from '../routes/students.js';
import exercisesRouter from '../routes/exercises.js';
import criteriaRouter from '../routes/criteria.js';
import { requireAuth } from '../middleware/auth.js';
import { initDatabase, closeDatabase, getDb } from '../db/db.js';

let db: any;
let app: express.Application;

beforeAll(async () => {
  await initDatabase('test');
  db = getDb();
});

afterAll(async () => {
  await closeDatabase();
});

export function createTestApp() {
  app = express();
  app.use(express.json());

  // Public routes
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);

  // Protected routes (same as index.ts)
  app.use('/api/classes', requireAuth, classesRouter);
  app.use('/api/students', requireAuth, studentsRouter);
  app.use('/api/exercises', requireAuth, exercisesRouter);
  app.use('/api/criteria', requireAuth, criteriaRouter);

  return app;
}

export function getTestDb() {
  return db;
}
