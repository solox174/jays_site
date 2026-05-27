import {type Handle, redirect} from '@sveltejs/kit';
import {authService} from '$lib/server/auth';

const PROTECTED = ['/scheduling', '/account', '/admin'];

export const handle: Handle = async ({event, resolve}) => {
    const sessionId = event.cookies.get('session');
    event.locals.user = await authService.verifySession(sessionId);

    if (!event.locals.user && PROTECTED.some(p => event.url.pathname.startsWith(p))) {
        redirect(303, '/login?from=' + event.url.pathname);
    }

    return resolve(event);
};