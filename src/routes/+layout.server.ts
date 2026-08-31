import type {LayoutServerLoad} from './$types';
import {repositories} from '$lib/server/storage';

export const load: LayoutServerLoad = async ({locals}) => {
    // Only for nav-link visibility (showing "Admin" in the gear menu) — NOT the actual
    // authorization boundary, so it's fine that this can go stale until the next
    // navigation if role is revoked mid-session. The real check is the fresh getById in
    // admin/+layout.server.ts, which runs on every /admin request regardless of this.
    // Skipped entirely for anonymous visitors to avoid the extra lookup on public pages.
    const isAdmin = locals.user
        ? (await repositories.customers.getById(locals.user.id))?.role === 'admin'
        : false;

    return {loggedIn: !!locals.user, isAdmin};
};