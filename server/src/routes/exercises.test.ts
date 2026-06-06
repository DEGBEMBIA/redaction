import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/setup.js';

const app = createTestApp();
let authToken: string;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  authToken = res.body.token;
});

describe('Exercises CRUD', () => {
  let exerciseId: number;
  let classId: number;

  beforeAll(async () => {
    // Create a class for the exercise
    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '6ème A', level: 'Collège' });
    classId = classRes.body.id;
  });

  it('POST /api/exercises - should create an exercise', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Rédaction sur la nature',
        subject: 'Décris ton paysage préféré',
        description: 'Exercice d\'expression écrite',
        class_id: classId,
        due_date: '2025-06-30',
      })
      .expect(201);

    expect(res.body.title).toBe('Rédaction sur la nature');
    expect(res.body.subject).toBe('Décris ton paysage préféré');
    exerciseId = res.body.id;
  });

  it('POST /api/exercises - should reject missing title', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ subject: 'Sujet test' })
      .expect(400);

    expect(res.body.error).toBe('Le titre est requis');
  });

  it('GET /api/exercises - should list all exercises', async () => {
    const res = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((e: any) => e.title === 'Rédaction sur la nature')).toBe(true);
  });

  it('GET /api/exercises/:id - should get a single exercise', async () => {
    const res = await request(app)
      .get(`/api/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.title).toBe('Rédaction sur la nature');
  });

  it('GET /api/exercises/:id - should return 404 for non-existent', async () => {
    const res = await request(app)
      .get('/api/exercises/9999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.error).toBe('Exercice non trouvé');
  });

  it('PUT /api/exercises/:id - should update an exercise', async () => {
    const res = await request(app)
      .put(`/api/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Rédaction sur les saisons',
        subject: 'Décris ta saison préférée',
      })
      .expect(200);

    expect(res.body.title).toBe('Rédaction sur les saisons');
  });

  it('DELETE /api/exercises/:id - should delete an exercise', async () => {
    const res = await request(app)
      .delete(`/api/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    await request(app).get('/api/exercises').expect(401);
    await request(app).post('/api/exercises').send({ title: 'Test' }).expect(401);
  });
});

describe('Criteria CRUD', () => {
  let criterionId: number;

  it('GET /api/criteria - should list all criteria', async () => {
    const res = await request(app)
      .get('/api/criteria')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    // The 6 seeded criteria
    expect(res.body.length).toBe(6);
    expect(res.body.some((c: any) => c.name === 'Orthographe')).toBe(true);
  });

  it('POST /api/criteria - should create a criterion', async () => {
    const res = await request(app)
      .post('/api/criteria')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Créativité',
        description: 'Originalité et créativité du contenu',
        max_score: 10,
        weight: 1.5,
      })
      .expect(201);

    expect(res.body.name).toBe('Créativité');
    expect(res.body.weight).toBe(1.5);
    criterionId = res.body.id;
  });

  it('POST /api/criteria - should reject missing name', async () => {
    const res = await request(app)
      .post('/api/criteria')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ max_score: 10 })
      .expect(400);

    expect(res.body.error).toBe('Le nom est requis');
  });

  it('PUT /api/criteria/:id - should update a criterion', async () => {
    const res = await request(app)
      .put(`/api/criteria/${criterionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Créativité & Imagination', max_score: 15 })
      .expect(200);

    expect(res.body.name).toBe('Créativité & Imagination');
    expect(res.body.max_score).toBe(15);
  });

  it('DELETE /api/criteria/:id - should delete a criterion', async () => {
    const res = await request(app)
      .delete(`/api/criteria/${criterionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    await request(app).get('/api/criteria').expect(401);
    await request(app).post('/api/criteria').send({ name: 'Test' }).expect(401);
  });
});
