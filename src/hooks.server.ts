
import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionId = event.cookies.get('session');
    const session = await getSession(sessionId);

    event.locals.user = session
        ? {
            sub: session.sub,
            email: session.email
        }
        : null;

    return resolve(event);
};