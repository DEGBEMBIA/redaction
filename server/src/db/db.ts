import knex, { Knex } from 'knex';
import { getKnexConfig } from './knexfile.js';

let db: Knex | null = null;

export function getDb(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function getKnex(): Knex {
  return getDb();
}

export async function initDatabase(env?: string): Promise<Knex> {
  const config = getKnexConfig(env);
  db = knex(config);

  // Run migrations
  await db.migrate.latest();

  // Run seeds
  await db.seed.run();

  console.log(`✓ Base de données initialisée (${config.client})`);
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}
