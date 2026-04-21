import { defineConfig } from 'drizzle-kit';
import path from 'node:path';

const dataDir = process.env.DATA_DIR ?? './data';

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: path.join(dataDir, 'reading.db'),
  },
  strict: true,
  verbose: true,
});
