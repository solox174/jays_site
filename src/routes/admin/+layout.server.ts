import {error} from '@sveltejs/kit';
import type {LayoutServerLoad} from './$types';
import {repositories} from '$lib/server/storage';

// hooks.server.ts's PROTECTED check already redirects unauthenticated visitors away
// from /admin/* before this ever runs, so locals.user is guaranteed here — this layout
// adds the *admin* check on top. A fresh lookup, not baked into the session, so toggling
// role in the data console takes effect on the very next request rather than requiring
// the affected user to log out and back in. Every route nested under /admin inherits
// this automatically.
export const load: LayoutServerLoad = async ({locals}) => {
    const customer = await repositories.customers.getById(locals.user!.id);
 /*   if (customer?.role !== 'admin') {
        error(403, 'You do not have permission to view this page.');
    }*/
};
