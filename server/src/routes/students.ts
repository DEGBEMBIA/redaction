import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET all students
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const students = await db('students as s')
      .select('s.*', db.raw('COALESCE(c.name, \'\') as class_name'))
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .orderBy(['s.last_name', 's.first_name']);
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single student
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const student = await db('students as s')
      .select('s.*', db.raw('COALESCE(c.name, \'\') as class_name'))
      .leftJoin('classes as c', 's.class_id', 'c.id')
      .where('s.id', req.params.id)
      .first();
    if (!student) return res.status(404).json({ error: 'Élève non trouvé' });
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create student
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { first_name, last_name, email, class_id } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: 'Le prénom et le nom sont requis' });

    const [inserted] = await db('students').insert({
      first_name, last_name, email: email || '', class_id: class_id || null,
    }).returning('id');
    const student = await db('students').where('id', inserted.id || inserted).first();
    res.status(201).json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update student
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { first_name, last_name, email, class_id } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: 'Le prénom et le nom sont requis' });

    const updated = await db('students').where('id', req.params.id).update({
      first_name, last_name, email: email || '', class_id: class_id || null,
    });
    if (updated === 0) return res.status(404).json({ error: 'Élève non trouvé' });
    const student = await db('students').where('id', req.params.id).first();
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const deleted = await db('students').where('id', req.params.id).del();
    if (deleted === 0) return res.status(404).json({ error: 'Élève non trouvé' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
