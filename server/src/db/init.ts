/**
 * Point d'entrée pour la base de données.
 * Réexporte depuis le module Knex-based db.ts pour compatibilité.
 */
export { getDb, initDatabase, closeDatabase, getKnex } from './db.js';
