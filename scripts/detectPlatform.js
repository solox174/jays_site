// Shared by svelte.config.js (plain Node, runs before Vite/SvelteKit even starts — can't
// import from src/lib, which is why this lives here instead) and
// src/lib/server/platform.ts (re-exports this for the app code). One source of truth for
// both the build-time adapter choice and the runtime repository/email provider choice.
//
// Plain process.env, not $env/static|dynamic/private — see the longer explanation in
// src/lib/server/platform.ts. VERCEL is a platform-intrinsic variable Vercel injects
// into both its build containers and deployed functions itself, not a Console-configured
// custom value, so it isn't subject to the Amplify-Hosting-build-only-env-var quirk that
// motivated $env/static/private elsewhere in this project.

/**
 * @typedef {'aws' | 'vercel'} Platform
 */

/**
 * @returns {Platform}
 */
export function detectPlatform() {
    if (process.env.BACKEND_PLATFORM === 'vercel' || process.env.BACKEND_PLATFORM === 'aws') {
        return process.env.BACKEND_PLATFORM;
    }

    if (process.env.VERCEL) return 'vercel';

    return 'aws';
}
