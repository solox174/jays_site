// Run with: DATABASE_URL=<connection string> npx tsx scripts/postgresMigrate.ts
// Applies src/lib/server/repository/postgres/schema.sql. Safe to re-run — every
// statement is idempotent (create table/extension if not exists).
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('Set DATABASE_URL in the environment before running this script.');
    process.exit(1);
}

const sql = neon(databaseUrl);
const schema = readFileSync(new URL('../src/lib/server/repository/postgres/schema.sql', import.meta.url), 'utf-8')
    // Strip comment lines before splitting — otherwise a statement preceded by a
    // comment on its own line gets discarded along with the comment.
    .replace(/^--.*$/gm, '');

// neon()'s query function runs one statement per call, it doesn't support
// multi-statement strings, so split on `;`.
const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

async function main() {
    for (const statement of statements) {
        console.log(`Running: ${statement.slice(0, 60)}...`);
        await sql.query(statement);
    }
    console.log('Migration complete.');
}

main();
