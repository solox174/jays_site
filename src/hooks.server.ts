import {type Handle, redirect} from '@sveltejs/kit';
import {authService} from '$lib/server/auth';

const PROTECTED = ['/scheduling', '/account', '/admin'];

export const handle: Handle = async ({event, resolve}) => {
    event.locals.user = await authService.verifySession(event.cookies);

    event.locals.token = event.locals.user ? event.cookies.get('id_token') : undefined;

    if (!event.locals.user && PROTECTED.some(p => event.url.pathname.startsWith(p))) {
        redirect(303, '/login?from=' + event.url.pathname);
    }

    return resolve(event);
};