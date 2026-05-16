import type { LayoutServerLoad } from './$types';
import { verifySession } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const session = await verifySession(cookies.get('session'));
    return { loggedIn: !!session };
};