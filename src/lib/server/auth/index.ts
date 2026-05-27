// To swap auth providers: replace this import with a different implementation
// (e.g. './supabase/authService') — no other files need to change.
import {cognitoAuthService} from './cognito/authService';
import type {AuthService} from './types';

export const authService: AuthService = cognitoAuthService;