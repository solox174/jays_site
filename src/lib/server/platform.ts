export type Platform = 'aws' | 'vercel';

// Shared by every assembly point that needs to pick a per-platform implementation
// (repository/index.ts, email/index.ts, ...) so the detection logic — and its
// caveats — live in exactly one place.
//
// Plain process.env, not $env/static|dynamic/private: this needs to reflect the
// *actual runtime* platform, and unlike a Console-configured secret, VERCEL is a
// platform-intrinsic variable Vercel injects into every deployed function itself —
// not something that goes through Amplify Hosting's build-only env var pipeline (see
// the note in reviews/config.ts). BACKEND_PLATFORM as an explicit override is provided
// for local testing and for the (rare) case auto-detection isn't enough; on Amplify
// Hosting specifically, a *custom* BACKEND_PLATFORM env var would hit that same
// build-only limitation — but since 'aws' is the fallback default anyway, that only
// matters if you're trying to force 'vercel' behavior while deployed to Amplify, an
// unlikely combination.
export function detectPlatform(): Platform {
    if (process.env.BACKEND_PLATFORM === 'vercel' || process.env.BACKEND_PLATFORM === 'aws') {
        return process.env.BACKEND_PLATFORM;
    }

    if (process.env.VERCEL) return 'vercel';

    return 'aws';
}
