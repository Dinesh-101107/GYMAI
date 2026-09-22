import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

const target = path.join(serverDir, 'prisma', 'schema.prisma');
const postgresSchema = path.join(serverDir, 'prisma', 'schema.postgres.prisma');

if (fs.existsSync(postgresSchema)) {
  fs.copyFileSync(postgresSchema, target);
  console.log('✅ Active schema switched to PostgreSQL (Neon / Supabase / Render / Railway mode).');
} else {
  console.log('PostgreSQL schema already present or default.');
}
