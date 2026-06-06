import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// GET dashboard statistics
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const db = getDb();

    const [total_students] = await db('students').count('id as count');
    const [total_classes] = await db('classes').count('id as count');
    const [total_exercises] = await db('exercises').count('id as count');
    const [total_submissions] = await db('submissions').count('id as count');

    const avgResult = await db('grades as g')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .select(db.raw('ROUND(AVG(g.score * ec.weight) / NULLIF(AVG(ec.max_score * ec.weight), 0) * 100, 2) as avg_score'))
      .first();
    const average_score = avgResult?.avg_score || 0;

    const recent_submissions = await db('submissions as s')
      .select(
        's.*',
        db.raw("COALESCE(st.first_name || ' ' || st.last_name, '') as student_name"),
        db.raw("COALESCE(e.title, '') as exercise_title")
      )
      .join('students as st', 's.student_id', 'st.id')
      .join('exercises as e', 's.exercise_id', 'e.id')
      .orderBy('s.submitted_at', 'desc')
      .limit(10);

    const class_distribution = await db('classes as c')
      .select('c.name', db.raw('COUNT(s.id) as count'))
      .leftJoin('students as s', 's.class_id', 'c.id')
      .groupBy('c.id');

    const top_students = await db('students as st')
      .join('submissions as s', 's.student_id', 'st.id')
      .join('grades as g', 'g.submission_id', 's.id')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .select(
        'st.id',
        db.raw("st.first_name || ' ' || st.last_name as name"),
        db.raw('ROUND(AVG(g.score * ec.weight) / NULLIF(AVG(ec.max_score * ec.weight), 0) * 100, 2) as avg_score')
      )
      .groupBy('st.id')
      .orderBy('avg_score', 'desc')
      .limit(5);

    res.json({
      total_students: Number(total_students.count),
      total_classes: Number(total_classes.count),
      total_exercises: Number(total_exercises.count),
      total_submissions: Number(total_submissions.count),
      average_score,
      recent_submissions,
      class_distribution,
      top_students,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET student progress
router.get('/student/:id/progress', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const progress = await db('submissions as s')
      .join('exercises as e', 's.exercise_id', 'e.id')
      .join('grades as g', 'g.submission_id', 's.id')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .where('s.student_id', id)
      .select(
        'e.title as exercise_title',
        'e.subject',
        's.submitted_at',
        db.raw('ROUND(AVG(g.score * ec.weight) / NULLIF(AVG(ec.max_score * ec.weight), 0) * 100, 2) as overall_score')
      )
      .groupBy('s.id')
      .orderBy('s.submitted_at', 'asc');

    // For criteria_breakdown, fetch separately (no GROUP_CONCAT in PG)
    const submissionsWithBreakdown = [];
    for (const p of progress) {
      const breakdown = await db('grades as g')
        .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
        .join('submissions as sub', 'g.submission_id', 'sub.id')
        .where('sub.exercise_id', db.raw('(SELECT id FROM exercises WHERE title = ?)', [p.exercise_title]))
        .where('sub.student_id', id)
        .select(db.raw("ec.name || ':' || g.score || '/' || ec.max_score as entry"))
        .orderBy('ec.name');

      const criteria_breakdown = breakdown.map((b: any) => b.entry).join('|');
      submissionsWithBreakdown.push({ ...p, criteria_breakdown: criteria_breakdown || '' });
    }

    res.json(submissionsWithBreakdown);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET class performance
router.get('/class/:id/performance', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const performance = await db('students as st')
      .select(
        'st.id as student_id',
        db.raw("st.first_name || ' ' || st.last_name as student_name"),
        db.raw('COUNT(DISTINCT s.id) as total_submissions'),
        db.raw('ROUND(AVG(g.score * ec.weight) / NULLIF(AVG(ec.max_score * ec.weight), 0) * 100, 2) as avg_score')
      )
      .leftJoin('submissions as s', 's.student_id', 'st.id')
      .leftJoin('grades as g', 'g.submission_id', 's.id')
      .leftJoin('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .where('st.class_id', id)
      .groupBy('st.id')
      .orderBy('avg_score', 'desc');

    res.json(performance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
