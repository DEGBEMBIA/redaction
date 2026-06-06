import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { getTestDb } from '../test/setup.js';
import { requireAuth } from '../middleware/auth.js';
import authRouter from '../routes/auth.js';
import submissionsRouter from '../routes/submissions.js';
import gradesRouter from '../routes/grades.js';
import statsRouter from '../routes/stats.js';
import aiRouter from '../routes/ai.js';

function createFullTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/submissions', requireAuth, submissionsRouter);
  app.use('/api/grades', requireAuth, gradesRouter);
  app.use('/api/stats', requireAuth, statsRouter);
  app.use('/api/ai', requireAuth, aiRouter);
  return app;
}

const app = createFullTestApp();
let authToken: string;
let testStudentId: number;
let testExerciseId: number;
let testSubmissionId: number;

beforeAll(async () => {
  const db = getTestDb();

  // Login
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  authToken = loginRes.body.token;

  // Create test data directly in DB using Knex
  const [classInsert] = await db('classes').insert({ name: 'Test Class' }).returning('id');
  const classId = classInsert.id || classInsert;

  const [studentInsert] = await db('students').insert({ first_name: 'Test', last_name: 'Student', class_id: classId }).returning('id');
  testStudentId = studentInsert.id || studentInsert;

  const [exerciseInsert] = await db('exercises').insert({ title: 'Test Exercise', subject: 'Write about...', class_id: classId }).returning('id');
  testExerciseId = exerciseInsert.id || exerciseInsert;

  const [subInsert] = await db('submissions').insert({ exercise_id: testExerciseId, student_id: testStudentId, content: 'Test content' }).returning('id');
  testSubmissionId = subInsert.id || subInsert;
});

describe('Submissions routes (smoke)', () => {
  it('GET /api/submissions should return submissions', async () => {
    const res = await request(app)
      .get('/api/submissions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/submissions/:id should return submission with grades', async () => {
    const res = await request(app)
      .get(`/api/submissions/${testSubmissionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.content).toBe('Test content');
    expect(res.body.grades).toBeDefined();
    expect(res.body.ai_feedback).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    await request(app).get('/api/submissions').expect(401);
    await request(app).get(`/api/submissions/${testSubmissionId}`).expect(401);
  });
});

describe('Grades routes (smoke)', () => {
  it('POST /api/grades/submission/:id should save grades', async () => {
    const db = getTestDb();
    const criteria = await db('evaluation_criteria').limit(3);

    const grades = criteria.map((c: any) => ({
      criterion_id: c.id,
      score: 7,
      comment: 'Bon travail',
    }));

    const res = await request(app)
      .post(`/api/grades/submission/${testSubmissionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ grades })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(criteria.length);
  });

  it('GET /api/grades/submission/:id should return grades', async () => {
    const res = await request(app)
      .get(`/api/grades/submission/${testSubmissionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/grades/student/:id/average should return average', async () => {
    const res = await request(app)
      .get(`/api/grades/student/${testStudentId}/average`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.avg_score).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    await request(app).post(`/api/grades/submission/${testSubmissionId}`).send({ grades: [] }).expect(401);
  });
});

describe('Stats routes (smoke)', () => {
  it('GET /api/stats/dashboard should return dashboard stats', async () => {
    const res = await request(app)
      .get('/api/stats/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.total_students).toBeGreaterThanOrEqual(1);
    expect(res.body.total_classes).toBeGreaterThanOrEqual(1);
    expect(res.body.total_exercises).toBeGreaterThanOrEqual(1);
    expect(res.body.total_submissions).toBeGreaterThanOrEqual(1);
    expect(res.body.recent_submissions).toBeDefined();
    expect(res.body.class_distribution).toBeDefined();
    expect(res.body.top_students).toBeDefined();
  });

  it('GET /api/stats/student/:id/progress should return progress', async () => {
    const res = await request(app)
      .get(`/api/stats/student/${testStudentId}/progress`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    await request(app).get('/api/stats/dashboard').expect(401);
  });
});

describe('AI routes (smoke)', () => {
  it('POST /api/ai/feedback/:id should generate feedback (template fallback)', async () => {
    const res = await request(app)
      .post(`/api/ai/feedback/${testSubmissionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.feedback).toBeDefined();
    expect(res.body.source).toBe('template');
    expect(res.body.feedback).toContain('Retour sur');
  });

  it('GET /api/ai/feedback/:id should return existing feedback', async () => {
    const res = await request(app)
      .get(`/api/ai/feedback/${testSubmissionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    await request(app).post(`/api/ai/feedback/${testSubmissionId}`).expect(401);
  });
});
