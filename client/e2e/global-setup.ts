import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  // Ensure the server data directory exists for the test database
  const dataDir = path.resolve(import.meta.dirname, '..', '..', 'server', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created server/data/ directory for E2E test database');
  }
}
