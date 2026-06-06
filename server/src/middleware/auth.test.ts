import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, requireAuth } from './auth.js';
import type { Request, Response, NextFunction } from 'express';

describe('Auth Middleware', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: 1, username: 'admin', role: 'admin' };
      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: 1, username: 'admin', role: 'admin' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(1);
      expect(decoded.username).toBe('admin');
      expect(decoded.role).toBe('admin');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw on tampered token', () => {
      const payload = { userId: 1, username: 'admin', role: 'admin' };
      const token = generateToken(payload);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered)).toThrow();
    });
  });

  describe('requireAuth', () => {
    it('should return 401 if no Authorization header', () => {
      const req = { headers: {} } as Request;
      const res = {
        status: (code: number) => {
          expect(code).toBe(401);
          return { json: (data: any) => expect(data.error).toBe('Authentification requise') };
        },
      } as unknown as Response;
      const next = (() => {}) as NextFunction;

      requireAuth(req, res, next);
    });

    it('should return 401 if Authorization header is not Bearer', () => {
      const req = { headers: { authorization: 'Basic token123' } } as Request;
      const res = {
        status: (code: number) => {
          expect(code).toBe(401);
          return { json: (data: any) => expect(data.error).toBe('Authentification requise') };
        },
      } as unknown as Response;
      const next = (() => {}) as NextFunction;

      requireAuth(req, res, next);
    });

    it('should call next() with valid token', () => {
      const token = generateToken({ userId: 1, username: 'admin', role: 'admin' });
      const req = { headers: { authorization: `Bearer ${token}` } } as Request;
      let nextCalled = false;        const res = { status: () => ({ json: () => {} }) } as unknown as unknown as Response;
      const next = (() => { nextCalled = true; }) as NextFunction;

      requireAuth(req, res, next);
      expect(nextCalled).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe(1);
    });

    it('should reject expired/invalid Bearer token', () => {
      const req = { headers: { authorization: 'Bearer invalid-jwt-token' } } as Request;
      const res = {
        status: (code: number) => {
          expect(code).toBe(401);
          return { json: (data: any) => expect(data.error).toBe('Token invalide ou expiré') };
        },
      } as unknown as Response;
      const next = (() => {}) as NextFunction;

      requireAuth(req, res, next);
    });
  });
});
