import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET all criteria
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const criteria = await db('evaluation_criteria').orderBy('name');
    res.json(criteria);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create criterion
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, description, max_score, weight } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });

    const [inserted] = await db('evaluation_criteria').insert({
      name, description: description || '', max_score: max_score || 10, weight: weight || 1.0,
    }).returning('id');
    const criterion = await db('evaluation_criteria').where('id', inserted.id || inserted).first();
    res.status(201).json(criterion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update criterion
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, description, max_score, weight } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });

    const updated = await db('evaluation_criteria').where('id', req.params.id).update({
      name, description: description || '', max_score: max_score || 10, weight: weight || 1.0,
    });
    if (updated === 0) return res.status(404).json({ error: 'Critère non trouvé' });
    const criterion = await db('evaluation_criteria').where('id', req.params.id).first();
    res.json(criterion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE criterion
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const deleted = await db('evaluation_criteria').where('id', req.params.id).del();
    if (deleted === 0) return res.status(404).json({ error: 'Critère non trouvé' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
