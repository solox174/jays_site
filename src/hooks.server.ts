import type {Handle} from '@sveltejs/kit';
import {verifySession} from '$lib/server/auth';

const PROTECTED = ['/scheduling', '/account', '/admin'];

export const handle: Handle = async ({event, resolve}) => {
    const sessionId = event.cookies.get('session');
    event.locals.user = await verifySession(sessionId);

    // TODO: uncomment for launch
    //if (!event.locals.user && PROTECTED.some(p => event.url.pathname.startsWith(p))) {
    //    redirect(303, '/login');
    //}

    return resolve(event);
};