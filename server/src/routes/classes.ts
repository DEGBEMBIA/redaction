import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET all classes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const classes = await db('classes').orderBy('name');
    res.json(classes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single class
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const cls = await db('classes').where('id', req.params.id).first();
    if (!cls) return res.status(404).json({ error: 'Classe non trouvée' });
    res.json(cls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create class
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, level, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });

    const [inserted] = await db('classes').insert({ name, level: level || '', description: description || '' }).returning('id');
    const cls = await db('classes').where('id', inserted.id || inserted).first();
    res.status(201).json(cls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update class
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, level, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });

    const updated = await db('classes').where('id', req.params.id).update({ name, level: level || '', description: description || '' });
    if (updated === 0) return res.status(404).json({ error: 'Classe non trouvée' });
    const cls = await db('classes').where('id', req.params.id).first();
    res.json(cls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE class
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const deleted = await db('classes').where('id', req.params.id).del();
    if (deleted === 0) return res.status(404).json({ error: 'Classe non trouvée' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
