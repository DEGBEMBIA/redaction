import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/init.js';
import { requireAuth } from './middleware/auth.js';

import authRouter from './routes/auth.js';
import classesRouter from './routes/classes.js';
import studentsRouter from './routes/students.js';
import exercisesRouter from './routes/exercises.js';
import criteriaRouter from './routes/criteria.js';
import submissionsRouter from './routes/submissions.js';
import gradesRouter from './routes/grades.js';
import statsRouter from './routes/stats.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth routes (public)
app.use('/api/auth', authRouter);

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected API Routes
app.use('/api/classes', requireAuth, classesRouter);
app.use('/api/students', requireAuth, studentsRouter);
app.use('/api/exercises', requireAuth, exercisesRouter);
app.use('/api/criteria', requireAuth, criteriaRouter);
app.use('/api/submissions', requireAuth, submissionsRouter);
app.use('/api/grades', requireAuth, gradesRouter);
app.use('/api/stats', requireAuth, statsRouter);
app.use('/api/ai', requireAuth, aiRouter);

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Serveur démarré sur http://localhost:${PORT}`);
      console.log(`✓ API disponible sur http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', err);
    process.exit(1);
  });

export default app;
