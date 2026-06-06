import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET grades for a submission
router.get('/submission/:submissionId', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const grades = await db('grades as g')
      .select('g.*', 'ec.name as criterion_name', 'ec.max_score', 'ec.weight')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .where('g.submission_id', req.params.submissionId);
    res.json(grades);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST save grades (batch upsert for a submission)
router.post('/submission/:submissionId', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { grades } = req.body;

    if (!Array.isArray(grades)) {
      return res.status(400).json({ error: 'Format de notes invalide' });
    }

    const submissionId = req.params.submissionId;

    for (const g of grades) {
      const existing = await db('grades')
        .where({ submission_id: submissionId, criterion_id: g.criterion_id })
        .first();

      if (existing) {
        await db('grades')
          .where({ submission_id: submissionId, criterion_id: g.criterion_id })
          .update({ score: g.score, comment: g.comment || '' });
      } else {
        await db('grades').insert({
          submission_id: submissionId,
          criterion_id: g.criterion_id,
          score: g.score,
          comment: g.comment || '',
        });
      }
    }

    const savedGrades = await db('grades as g')
      .select('g.*', 'ec.name as criterion_name', 'ec.max_score', 'ec.weight')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .where('g.submission_id', submissionId);

    res.json(savedGrades);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET average score for a student
router.get('/student/:studentId/average', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = await db('grades as g')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .join('submissions as s', 'g.submission_id', 's.id')
      .where('s.student_id', req.params.studentId)
      .select(
        db.raw('ROUND(AVG(g.score * ec.weight) / NULLIF(AVG(ec.max_score * ec.weight), 0) * 100, 2) as avg_score'),
        db.raw('COUNT(DISTINCT s.id) as total_submissions')
      )
      .first();

    res.json(result || { avg_score: 0, total_submissions: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
