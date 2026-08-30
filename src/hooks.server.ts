import {type Handle, redirect} from '@sveltejs/kit';
import {authService} from '$lib/server/auth';
import fs from 'fs';
import path from 'path';
import { building } from '$app/environment';

const PROTECTED = ['/scheduling', '/account', '/admin', '/profile'];

if (!building) {
    try {
        // 1. Resolve path to your root .env file
        const envPath = path.resolve(process.cwd(), '.env');

        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');

            // 2. Parse out keys from lines like KEY="value" or KEY=
            const envKeys = envContent
                .split('\n')
                .map(line => line.trim())
                // Ignore comments and empty lines
                .filter(line => line && !line.startsWith('#'))
                // Split by equals sign and extract the key name
                .map(line => line.split('=')[0].trim());

            // 3. Scan for missing or empty runtime keys
            const missingVars = envKeys.filter(key => {
                const value = process.env[key];
                return value === undefined || value === null || value.trim() === '';
            });

            // 4. Fail loudly if Amplify didn't populate a required variable
            if (missingVars.length > 0) {
                console.error('❌ CRITICAL ENGINE FAILURE: Environment Variable Mismatch');
                console.error(`Amplify runtime environment is missing values for: \n -> ${missingVars.join('\n -> ')}`);

                // Optional: Stop the server immediately to prevent serving broken states
                process.exit(1);
            } else {
                console.log('✅ Environment check passed. All keys resolved from process.env.');
            }
        }
    } catch (error) {
        console.warn('⚠️ Environment validator skipped: .env template file not found.', error);
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