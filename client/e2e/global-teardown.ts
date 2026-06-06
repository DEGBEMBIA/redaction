import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  // Remove test database
  const testDbPath = path.resolve(import.meta.dirname, '..', '..', 'server', 'data', 'test-e2e.db');
  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      try { fs.unlinkSync(testDbPath + '-wal'); } catch { /* ignore */ }
      try { fs.unlinkSync(testDbPath + '-shm'); } catch { /* ignore */ }
      console.log('🧹 Test database cleaned up');
    }
  } catch (err) {
    console.warn('⚠️  Could not delete test database:', err);
  }
}
