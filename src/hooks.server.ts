import {type Handle, redirect} from '@sveltejs/kit';
import {authService} from '$lib/server/auth';
import {building} from '$app/environment';
import fs from 'node:fs';
import path from 'node:path';

const PROTECTED = ['/scheduling', '/account', '/admin', '/profile'];

// Amplify's compute Lambda never receives Console-configured env vars/secrets at
// runtime — scripts/writeRuntimeEnv.js resolves them against the CodeBuild build
// container (the one place they ARE available) and writes the result into the deployed
// bundle as .env. This reads that back into process.env at cold start, before anything
// else runs. Never overwrites a value that's already set, so it's harmless everywhere
// else: Vercel injects real env vars into process.env directly, so either this file
// doesn't exist there or every key it lists is already populated.
if (!building) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            fs.readFileSync(envPath, 'utf-8')
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
                .forEach(line => {
                    const firstEquals = line.indexOf('=');
                    if (firstEquals === -1) return;

                    const key = line.substring(0, firstEquals).trim();
                    if (process.env[key]) return;

                    let value = line.substring(firstEquals + 1).trim();
                    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    if (value) process.env[key] = value;
                });
        }
    } catch (e) {
        console.warn('.env merge skipped:', e);
    }
}

// SvelteKit server hook: runs on every request before route handlers and load
// functions. Attaches the authenticated user to event.locals so any server
// load function or action can read it without re-verifying the session.
export const handle: Handle = async ({event, resolve}) => {
    event.locals.user = await authService.verifySession(event.cookies);

    event.locals.token = event.locals.user ? event.cookies.get('id_token') : undefined;
    event.locals.accessToken = event.locals.user ? event.cookies.get('access_token') : undefined;

    // Redirect unauthenticated users to /login with a `from` param so they can
    // be sent back to the originally requested page after signing in.
    if (!event.locals.user && PROTECTED.some(p => event.url.pathname.startsWith(p))) {
        redirect(303, '/login?from=' + event.url.pathname);
    }

    return resolve(event);
};