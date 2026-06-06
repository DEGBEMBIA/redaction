import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Check if data already exists
  const classCount = await knex('classes').count('id as count').first();
  if (classCount && (classCount.count as number) > 0) {
    console.log('✓ Données déjà présentes, seed ignoré');
    return;
  }

  // 1. Seed evaluation criteria
  const criteria = [
    { name: 'Orthographe', description: 'Correction orthographique du texte', max_score: 10, weight: 1.0 },
    { name: 'Grammaire', description: 'Respect des règles grammaticales', max_score: 10, weight: 1.0 },
    { name: 'Vocabulaire', description: 'Richesse et précision du vocabulaire', max_score: 10, weight: 1.0 },
    { name: 'Structure', description: 'Organisation et cohérence du texte', max_score: 10, weight: 1.0 },
    { name: 'Style', description: "Style d'écriture et originalité", max_score: 10, weight: 1.0 },
    { name: 'Ponctuation', description: 'Usage correct de la ponctuation', max_score: 5, weight: 0.5 },
  ];

  for (const c of criteria) {
    await knex('evaluation_criteria').insert(c);
  }
  console.log('✓ Critères d\'évaluation ajoutés');

  // 2. Seed a sample class
  await knex('classes').insert({
    name: '6ème A',
    level: 'Collège',
    description: 'Classe de 6ème année - Français',
  });
  console.log("✓ Classe '6ème A' ajoutée");

  // 3. Seed default admin user
  const userCount = await knex('users').count('id as count').first();
  if (userCount && (userCount.count as number) === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await knex('users').insert({
      username: 'admin',
      email: 'admin@redaction.app',
      password_hash: passwordHash,
      full_name: 'Professeur Admin',
      role: 'admin',
    });
    console.log('✓ Utilisateur admin créé (admin / admin123)');
  }
}
