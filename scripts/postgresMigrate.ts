// Run with: DATABASE_URL=<connection string> npx tsx scripts/postgresMigrate.ts
// Applies src/lib/server/storage/postgres/schema.sql. Safe to re-run — every
// statement is idempotent (create table/extension if not exists).
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('Set DATABASE_URL in the environment before running this script.');
    process.exit(1);
}

const sql = neon(databaseUrl);
const schema = readFileSync(new URL('../src/lib/server/storage/postgres/schema.sql', import.meta.url), 'utf-8')
    // Strip comment lines before splitting — otherwise a statement preceded by a
    // comment on its own line gets discarded along with the comment.
    .replace(/^--.*$/gm, '');

// neon()'s query function runs one statement per call, it doesn't support
// multi-statement strings, so split on `;`.
const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

// Postgres error codes for "this already exists" — safe to skip on a re-run rather
// than fail the whole migration. See https://www.postgresql.org/docs/current/errcodes-appendix.html
const ALREADY_EXISTS_CODES = new Set([
    '42710', // duplicate_object (e.g. a constraint)
    '42P07', // duplicate_table
    '42701', // duplicate_column
]);

async function main() {
    for (const statement of statements) {
        console.log(`Running: ${statement.slice(0, 60)}...`);
        try {
            await sql.query(statement);
        } catch (e) {
            const code = (e as {code?: string}).code;
            if (code && ALREADY_EXISTS_CODES.has(code)) {
                console.log(`  already applied, skipping`);
                continue;
            }
            throw e;
        }
    }
    console.log('Migration complete.');
}

main();
