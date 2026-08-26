import {cognitoAuthService} from './cognito/authService';
import {postgresAuthService} from './postgres/authService';
import {detectPlatform} from '$lib/server/platform';
import type {AuthService} from './types';

// Picked per-platform rather than a single hardcoded import — see platform.ts. To add
// a third provider: implement AuthService in a sibling folder and add it here.
export const authService: AuthService = detectPlatform() === 'vercel' ? postgresAuthService : cognitoAuthService;
