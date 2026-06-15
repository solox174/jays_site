import {type Handle, redirect} from '@sveltejs/kit';
import {authService} from '$lib/server/auth';

const PROTECTED = ['/scheduling', '/account', '/admin'];

// SvelteKit server hook: runs on every request before route handlers and load
// functions. Attaches the authenticated user to event.locals so any server
// load function or action can read it without re-verifying the session.
export const handle: Handle = async ({event, resolve}) => {
    event.locals.user = await authService.verifySession(event.cookies);

    event.locals.token = event.locals.user ? event.cookies.get('id_token') : undefined;

    // Redirect unauthenticated users to /login with a `from` param so they can
    // be sent back to the originally requested page after signing in.
    if (!event.locals.user && PROTECTED.some(p => event.url.pathname.startsWith(p))) {
        redirect(303, '/login?from=' + event.url.pathname);
    }

    return resolve(event);
};