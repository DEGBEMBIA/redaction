import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, getTestDb } from '../test/setup.js';

const app = createTestApp();
let authToken: string;

beforeAll(async () => {
  // Login to get auth token
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  authToken = res.body.token;
});

describe('Classes CRUD', () => {
  let classId: number;

  it('POST /api/classes - should create a class', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '5ème B', level: 'Collège', description: 'Classe de 5ème' })
      .expect(201);

    expect(res.body.name).toBe('5ème B');
    expect(res.body.level).toBe('Collège');
    classId = res.body.id;
  });

  it('POST /api/classes - should reject missing name', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ level: 'Collège' })
      .expect(400);

    expect(res.body.error).toBe('Le nom est requis');
  });

  it('GET /api/classes - should list all classes', async () => {
    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((c: any) => c.name === '5ème B')).toBe(true);
  });

  it('GET /api/classes/:id - should get a single class', async () => {
    const res = await request(app)
      .get(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.name).toBe('5ème B');
  });

  it('GET /api/classes/:id - should return 404 for non-existent class', async () => {
    const res = await request(app)
      .get('/api/classes/9999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.error).toBe('Classe non trouvée');
  });

  it('PUT /api/classes/:id - should update a class', async () => {
    const res = await request(app)
      .put(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '5ème B - Option Français', level: 'Collège', description: 'Classe option français' })
      .expect(200);

    expect(res.body.name).toBe('5ème B - Option Français');
  });

  it('DELETE /api/classes/:id - should delete a class', async () => {
    const res = await request(app)
      .delete(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify deletion
    await request(app)
      .get(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('should reject unauthenticated requests', async () => {
    await request(app)
      .get('/api/classes')
      .expect(401);

    await request(app)
      .post('/api/classes')
      .send({ name: 'Test' })
      .expect(401);

    await request(app)
      .put(`/api/classes/1`)
      .send({ name: 'Test' })
      .expect(401);

    await request(app)
      .delete('/api/classes/1')
      .expect(401);
  });
});

describe('Students CRUD', () => {
  let studentId: number;
  let classId: number;

  beforeAll(async () => {
    // Create a class for the student
    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '6ème A', level: 'Collège', description: 'Test class' });
    classId = classRes.body.id;
  });

  it('POST /api/students - should create a student', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        first_name: 'Marie',
        last_name: 'Curie',
        email: 'marie@example.com',
        class_id: classId,
      })
      .expect(201);

    expect(res.body.first_name).toBe('Marie');
    expect(res.body.last_name).toBe('Curie');
    studentId = res.body.id;
  });

  it('POST /api/students - should reject missing names', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'test@test.com' })
      .expect(400);

    expect(res.body.error).toBe('Le prénom et le nom sont requis');
  });

  it('GET /api/students - should list all students', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const student = res.body.find((s: any) => s.id === studentId);
    expect(student).toBeDefined();
    expect(student.class_name).toBe('6ème A');
  });

  it('GET /api/students/:id - should get a single student', async () => {
    const res = await request(app)
      .get(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.first_name).toBe('Marie');
  });

  it('PUT /api/students/:id - should update a student', async () => {
    const res = await request(app)
      .put(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        first_name: 'Marie',
        last_name: 'Curie-Sklodowska',
        email: 'marie@example.com',
      })
      .expect(200);

    expect(res.body.last_name).toBe('Curie-Sklodowska');
  });

  it('DELETE /api/students/:id - should delete a student', async () => {
    const res = await request(app)
      .delete(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify deletion
    await request(app)
      .get(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
