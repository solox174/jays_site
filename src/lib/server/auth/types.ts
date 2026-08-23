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
    | { ok: true; user: { id: string; email?: string; firstName?: string; lastName?: string; phoneNumber?: string } }
    | { ok: false; challengeName?: string }

export type ChangePasswordResult =
    | { ok: true }
    | { ok: false; errorText: string }

export interface AuthService {
    signup(user: NewUser, password: string): Promise<SignupResult>;
    confirmSignup(username: string, code: string): Promise<void>;
    login(username: string, password: string, cookies: Cookies): Promise<LoginResult>;
    logout(cookies: Cookies): Promise<void>;
    verifySession(cookies: Cookies): Promise<SessionUser | null>;
    // Requires the caller's own access token (from the current session) plus their
    // current password — not an admin-style reset — so no elevated IAM permissions
    // are needed beyond what login/signup already use.
    changePassword(accessToken: string, oldPassword: string, newPassword: string): Promise<ChangePasswordResult>;
}