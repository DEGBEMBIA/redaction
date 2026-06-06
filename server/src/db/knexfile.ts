import path from 'path';
import type { Knex } from 'knex';

const DB_DIR = path.resolve(import.meta.dirname, '..', '..', 'data');

const configs: Record<string, Knex.Config> = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.TEST_DB_PATH || path.join(DB_DIR, 'redaction.db'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(import.meta.dirname, 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.resolve(import.meta.dirname, 'seeds'),
      extension: 'ts',
    },
    pool: {
      afterCreate: (conn: any, cb: Function) => {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
        cb();
      },
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'redaction',
      user: process.env.PGUSER || 'redaction',
      password: process.env.PGPASSWORD || 'redaction',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.resolve(import.meta.dirname, 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.resolve(import.meta.dirname, 'seeds'),
      extension: 'ts',
    },
  },

  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(import.meta.dirname, 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.resolve(import.meta.dirname, 'seeds'),
      extension: 'ts',
    },
  },
};

export default configs;

export function getKnexConfig(env?: string): Knex.Config {
  const environment = env || process.env.NODE_ENV || 'development';
  return configs[environment] || configs.development;
}
