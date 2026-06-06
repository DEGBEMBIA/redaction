import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET all exercises
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const exercises = await db('exercises as e')
      .select('e.*', db.raw('COALESCE(c.name, \'\') as class_name'))
      .leftJoin('classes as c', 'e.class_id', 'c.id')
      .orderBy('e.created_at', 'desc');
    res.json(exercises);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single exercise
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const exercise = await db('exercises as e')
      .select('e.*', db.raw('COALESCE(c.name, \'\') as class_name'))
      .leftJoin('classes as c', 'e.class_id', 'c.id')
      .where('e.id', req.params.id)
      .first();
    if (!exercise) return res.status(404).json({ error: 'Exercice non trouvé' });
    res.json(exercise);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create exercise
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, subject, description, class_id, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Le titre est requis' });

    const [inserted] = await db('exercises').insert({
      title, subject: subject || '', description: description || '',
      class_id: class_id || null, due_date: due_date || '',
    }).returning('id');
    const exercise = await db('exercises').where('id', inserted.id || inserted).first();
    res.status(201).json(exercise);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update exercise
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, subject, description, class_id, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Le titre est requis' });

    const updated = await db('exercises').where('id', req.params.id).update({
      title, subject: subject || '', description: description || '',
      class_id: class_id || null, due_date: due_date || '',
    });
    if (updated === 0) return res.status(404).json({ error: 'Exercice non trouvé' });
    const exercise = await db('exercises').where('id', req.params.id).first();
    res.json(exercise);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exercise
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const deleted = await db('exercises').where('id', req.params.id).del();
    if (deleted === 0) return res.status(404).json({ error: 'Exercice non trouvé' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
