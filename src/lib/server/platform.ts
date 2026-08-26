// Detection logic lives in scripts/detectPlatform.js — it needs to be importable from
// svelte.config.js (plain Node, runs before Vite/SvelteKit starts) as well as here, so
// both the build-time adapter choice and this runtime provider choice stay in sync.
export {detectPlatform} from '../../../scripts/detectPlatform.js';
export type Platform = 'aws' | 'vercel';
