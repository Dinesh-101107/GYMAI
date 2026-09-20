import fs from 'fs';
import path from 'path';

const root = process.cwd();
const target = path.join(root, 'prisma', 'schema.prisma');
const postgresSchema = path.join(root, 'prisma', 'schema.postgres.prisma');

if (fs.existsSync(postgresSchema)) {
  fs.copyFileSync(postgresSchema, target);
  console.log('✅ Active schema switched to PostgreSQL (Neon / Supabase / Render / Railway mode).');
} else {
  console.log('PostgreSQL schema already present or default.');
}
