import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/init.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
    }

    const user = await db('users')
      .select('id', 'username', 'email', 'password_hash', 'full_name', 'role')
      .where('username', username)
      .orWhere('email', username)
      .first();

    if (!user) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
    }

    const token = generateToken({ userId: user.id, username: user.username, role: user.role });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const existing = await db('users').where('username', username).orWhere('email', email).first();
    if (existing) {
      return res.status(409).json({ error: "Nom d'utilisateur ou email déjà utilisé" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const [inserted] = await db('users').insert({
      username, email, password_hash: passwordHash, full_name, role: 'teacher',
    }).returning(['id', 'username', 'email', 'full_name', 'role']);

    const user = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role')
      .where('id', inserted.id || inserted)
      .first();

    const token = generateToken({ userId: user.id, username: user.username, role: user.role });
    res.status(201).json({ token, user });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const user = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role', 'created_at')
      .where('id', req.user!.userId)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err: any) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
