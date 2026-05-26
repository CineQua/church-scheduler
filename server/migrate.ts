// Standalone migration runner: `npm run db:migrate`.
// Importing ./db runs migrate() + seedRanks() and seeds the default rules row.
import { initDb } from './db';

initDb();
console.log('[migrate] schema is up to date');
process.exit(0);
