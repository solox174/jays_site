import fs from 'node:fs';
import path from 'node:path';

// Amplify Hosting's CodeBuild container is the only place Console-configured env
// vars/secrets are actually available to this app — the deployed compute Lambda's own
// process.env never receives them (see src/lib/server/email/resend/emailService.ts).
// This runs from amplify.yml's build phase, where those values ARE present in
// process.env, and resolves them against .env's key list: any key that's set here
// overwrites .env's placeholder, anything unset keeps .env's existing value (a real
// default, or empty). The result is written into the deployed bundle, where
// hooks.server.ts reads it back into process.env at cold start.
//
// Not used on Vercel at all — that platform already injects real env vars into
// process.env directly, so this script only runs from the Amplify build pipeline.
const destPath = process.argv[2];
if (!destPath) {
    console.error('Usage: node scripts/writeRuntimeEnv.js <destination .env path>');
    process.exit(1);
}

const source = fs.readFileSync(path.resolve('.env'), 'utf-8');

const resolved = source
    .split('\n')
    .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        const firstEquals = trimmed.indexOf('=');
        if (firstEquals === -1) return line;

        const key = trimmed.substring(0, firstEquals).trim();
        let fileValue = trimmed.substring(firstEquals + 1).trim();
        if ((fileValue.startsWith('"') && fileValue.endsWith('"')) || (fileValue.startsWith("'") && fileValue.endsWith("'"))) {
            fileValue = fileValue.slice(1, -1);
        }

        const buildValue = process.env[key];
        const resolvedValue = buildValue && buildValue.trim() !== '' ? buildValue : fileValue;

        return `${key}="${resolvedValue.replace(/"/g, '\\"')}"`;
    })
    .join('\n');

fs.mkdirSync(path.dirname(path.resolve(destPath)), {recursive: true});
fs.writeFileSync(path.resolve(destPath), resolved);
console.log(`Wrote resolved runtime env to ${destPath}`);
