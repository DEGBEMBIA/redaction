import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET all submissions
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { exercise_id, student_id } = req.query;

    let query = db('submissions as s')
      .select(
        's.*',
        db.raw("COALESCE(st.first_name || ' ' || st.last_name, '') as student_name"),
        db.raw("COALESCE(e.title, '') as exercise_title")
      )
      .join('students as st', 's.student_id', 'st.id')
      .join('exercises as e', 's.exercise_id', 'e.id');

    if (exercise_id) {
      query = query.where('s.exercise_id', Number(exercise_id));
    }
    if (student_id) {
      query = query.where('s.student_id', Number(student_id));
    }

    const submissions = await query.orderBy('s.submitted_at', 'desc');
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET submission by ID with grades
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const submission = await db('submissions as s')
      .select(
        's.*',
        db.raw("COALESCE(st.first_name || ' ' || st.last_name, '') as student_name"),
        db.raw("COALESCE(e.title, '') as exercise_title")
      )
      .join('students as st', 's.student_id', 'st.id')
      .join('exercises as e', 's.exercise_id', 'e.id')
      .where('s.id', req.params.id)
      .first();

    if (!submission) return res.status(404).json({ error: 'Soumission non trouvée' });

    const grades = await db('grades as g')
      .select('g.*', 'ec.name as criterion_name', 'ec.max_score', 'ec.weight')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .where('g.submission_id', req.params.id);

    const ai_feedback = await db('ai_feedback')
      .where('submission_id', req.params.id)
      .orderBy('created_at', 'desc');

    res.json({ ...submission, grades, ai_feedback });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create submission
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { exercise_id, student_id, content } = req.body;
    if (!exercise_id || !student_id) {
      return res.status(400).json({ error: "L'exercice et l'élève sont requis" });
    }

    const [inserted] = await db('submissions').insert({
      exercise_id, student_id, content: content || '',
    }).returning('id');
    const submission = await db('submissions').where('id', inserted.id || inserted).first();
    res.status(201).json(submission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update submission content
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { content } = req.body;
    const updated = await db('submissions').where('id', req.params.id).update({ content: content || '' });
    if (updated === 0) return res.status(404).json({ error: 'Soumission non trouvée' });
    const submission = await db('submissions').where('id', req.params.id).first();
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE submission
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const deleted = await db('submissions').where('id', req.params.id).del();
    if (deleted === 0) return res.status(404).json({ error: 'Soumission non trouvée' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
