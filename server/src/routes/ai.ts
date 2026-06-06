import { Router, Request, Response } from 'express';
import { getDb } from '../db/init.js';

const router = Router();

// POST generate AI feedback for a submission
router.post('/feedback/:submissionId', async (req: Request, res: Response) => {
  try {
    const db = getDb();

    const submission = await db('submissions as s')
      .select(
        's.*',
        db.raw("COALESCE(st.first_name || ' ' || st.last_name, '') as student_name"),
        db.raw("COALESCE(e.title, '') as exercise_title"),
        db.raw("COALESCE(e.subject, '') as subject")
      )
      .join('students as st', 's.student_id', 'st.id')
      .join('exercises as e', 's.exercise_id', 'e.id')
      .where('s.id', req.params.submissionId)
      .first();

    if (!submission) return res.status(404).json({ error: 'Soumission non trouvée' });

    const grades = await db('grades as g')
      .select('g.*', 'ec.name as criterion_name', 'ec.max_score', 'ec.weight')
      .join('evaluation_criteria as ec', 'g.criterion_id', 'ec.id')
      .where('g.submission_id', req.params.submissionId);

    // Build prompt for the AI
    const gradesSummary = grades.map((g: any) =>
      `- ${g.criterion_name}: ${g.score}/${g.max_score} (poids: ${g.weight})${g.comment ? ` - Commentaire: ${g.comment}` : ''}`
    ).join('\n');

    const prompt = `Tu es un professeur de français qui évalue la rédaction d'un élève.

Sujet de l'exercice: ${submission.subject || submission.exercise_title}

Texte de l'élève:
${submission.content}

Notes attribuées:
${gradesSummary}

${
  req.body.custom_prompt
    ? `\nInstruction supplémentaire: ${req.body.custom_prompt}\n`
    : ''
}

Génère un retour détaillé pour l'élève en français. Inclus:
1. Un résumé général de la performance
2. Les points forts
3. Les points à améliorer
4. Des conseils concrets pour progresser
5. Un encouragement final

Sois constructif et bienveillant.`;

    try {
      // Try to use Ollama if available
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Ollama not available');

      const data = await response.json();

      await db('ai_feedback').insert({
        submission_id: Number(req.params.submissionId),
        feedback: data.response,
      });

      res.json({ feedback: data.response, source: 'ollama' });
    } catch (err) {
      console.error('AI feedback generation error (Ollama not available):', err);
      const feedback = generateStructuredFeedback(submission, grades);

      await db('ai_feedback').insert({
        submission_id: Number(req.params.submissionId),
        feedback,
      });

      res.json({ feedback, source: 'template' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET AI feedback for a submission
router.get('/feedback/:submissionId', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const feedback = await db('ai_feedback')
      .where('submission_id', req.params.submissionId)
      .orderBy('created_at', 'desc');
    res.json(feedback);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function generateStructuredFeedback(submission: any, grades: any[]): string {
  const totalScore = grades.reduce((sum: number, g: any) => sum + (g.score / g.max_score) * (g.weight || 1), 0);
  const totalWeight = grades.reduce((sum: number, g: any) => sum + (g.weight || 1), 0);
  const percentage = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  let appreciation = 'Excellent travail !';
  if (percentage < 40) appreciation = 'Des progrès sont nécessaires.';
  else if (percentage < 60) appreciation = 'Travail satisfaisant, mais peut mieux faire.';
  else if (percentage < 80) appreciation = 'Bon travail ! Continue comme ça.';

  const strengths = grades
    .filter((g: any) => g.score / g.max_score >= 0.7)
    .map((g: any) => g.criterion_name);
  const weaknesses = grades
    .filter((g: any) => g.score / g.max_score < 0.5)
    .map((g: any) => g.criterion_name);

  let feedback = `## Retour sur "${submission.exercise_title}"\n\n`;
  feedback += `**Note globale : ${percentage}/100**\n\n`;
  feedback += `### Appréciation\n${appreciation}\n\n`;

  if (strengths.length > 0) {
    feedback += `### Points forts\n`;
    strengths.forEach((s: string) => { feedback += `- ✓ ${s}\n`; });
    feedback += '\n';
  }

  if (weaknesses.length > 0) {
    feedback += `### Points à améliorer\n`;
    weaknesses.forEach((w: string) => { feedback += `- ⚠ ${w}\n`; });
    feedback += '\n';
  }

  feedback += `### Conseils pour progresser\n`;
  if (weaknesses.includes('Orthographe')) {
    feedback += `- Relis-toi attentivement avant de rendre ton travail\n`;
    feedback += `- Utilise un dictionnaire ou un correcteur orthographique\n`;
  }
  if (weaknesses.includes('Grammaire')) {
    feedback += `- Révise les règles de conjugaison et d'accord\n`;
    feedback += `- Fais des exercices de grammaire régulièrement\n`;
  }
  if (weaknesses.includes('Vocabulaire')) {
    feedback += `- Lis davantage pour enrichir ton vocabulaire\n`;
    feedback += `- Utilise un dictionnaire des synonymes\n`;
  }
  if (weaknesses.includes('Structure')) {
    feedback += `- Fais un plan avant de commencer à écrire\n`;
    feedback += `- Assure-toi que ton texte a une introduction, un développement et une conclusion\n`;
  }
  if (strengths.length === 0 && weaknesses.length === 0) {
    feedback += `- Continue à t'entraîner régulièrement\n`;
    feedback += `- N'hésite pas à demander de l'aide à ton professeur\n`;
  }

  feedback += `\n### Encouragement\nContinue à travailler dur, chaque exercice est une opportunité de progresser ! 📚✨`;

  return feedback;
}

export default router;
