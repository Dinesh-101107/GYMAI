import fs from 'fs';
import path from 'path';

const root = process.cwd();
const target = path.join(root, 'prisma', 'schema.prisma');
const sqliteSchema = path.join(root, 'prisma', 'schema.sqlite.prisma');
const envFile = path.join(root, '.env');

fs.copyFileSync(sqliteSchema, target);
console.log('✅ Active schema switched to SQLite (zero-config local mode).');

let envContent = '';
if (fs.existsSync(envFile)) {
  envContent = fs.readFileSync(envFile, 'utf8');
}

if (envContent.includes('DATABASE_URL=')) {
  envContent = envContent.replace(/DATABASE_URL=.*/g, 'DATABASE_URL="file:./dev.db"');
} else {
  envContent += '\nDATABASE_URL="file:./dev.db"\n';
}

fs.writeFileSync(envFile, envContent);
console.log('✅ Updated .env with DATABASE_URL="file:./dev.db"');
