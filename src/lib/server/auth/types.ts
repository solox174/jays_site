import type {Cookies} from '@sveltejs/kit';

export interface NewUser {
    email: string;
    firstName?: string | null;
    lastName: string;
    phoneNumber: string;
}

export interface SessionUser {
    id: string;
    email: string;
}

// Discriminated union on `ok`: callers narrow to the success or failure branch
// with a single `if (result.ok)` check, and TypeScript enforces exhaustiveness.
export type SignupResult =
    | { ok: true; userConfirmed: boolean; userSub: string }
    | { ok: false }

export type LoginResult =
    | { ok: true; user: { id: string; email?: string } }
    | { ok: false; challengeName?: string }

export interface AuthService {
    signup(user: NewUser, password: string): Promise<SignupResult>;
    confirmSignup(username: string, code: string): Promise<void>;
    login(username: string, password: string, cookies: Cookies): Promise<LoginResult>;
    logout(cookies: Cookies): Promise<void>;
    verifySession(cookies: Cookies): Promise<SessionUser | null>;
}