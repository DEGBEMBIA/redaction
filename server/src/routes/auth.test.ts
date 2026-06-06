import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/setup.js';

const app = createTestApp();

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('admin');
      expect(res.body.user.full_name).toBe('Professeur Admin');
    });

    it('should login with email instead of username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin@redaction.app', password: 'admin123' })
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('admin');
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpass' })
        .expect(401);

      expect(res.body.error).toBe('Nom d\'utilisateur ou mot de passe incorrect');
    });

    it('should return 401 with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'test123' })
        .expect(401);

      expect(res.body.error).toBe('Nom d\'utilisateur ou mot de passe incorrect');
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' })
        .expect(400);

      expect(res.body.error).toBe('Nom d\'utilisateur et mot de passe requis');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newteacher',
          email: 'teacher@test.com',
          password: 'password123',
          full_name: 'New Teacher',
        })
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('newteacher');
      expect(res.body.user.full_name).toBe('New Teacher');
    });

    it('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          email: 'another@test.com',
          password: 'password123',
          full_name: 'Another',
        })
        .expect(409);

      expect(res.body.error).toBe('Nom d\'utilisateur ou email déjà utilisé');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'unique@test.com',
          password: 'password123',
          full_name: 'User 1',
        })
        .expect(201);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'unique@test.com',
          password: 'password123',
          full_name: 'User 2',
        })
        .expect(409);

      expect(res.body.error).toBe('Nom d\'utilisateur ou email déjà utilisé');
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shortpass',
          email: 'short@test.com',
          password: '12345',
          full_name: 'Short Pass',
        })
        .expect(400);

      expect(res.body.error).toBe('Le mot de passe doit contenir au moins 6 caractères');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'test' })
        .expect(400);

      expect(res.body.error).toBe('Tous les champs sont requis');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      // First login to get a token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .expect(200);

      expect(res.body.username).toBe('admin');
      expect(res.body.full_name).toBe('Professeur Admin');
      expect(res.body.role).toBe('admin');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.error).toBe('Authentification requise');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.error).toBe('Token invalide ou expiré');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
    });
  });
});
