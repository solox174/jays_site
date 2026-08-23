declare global {
    namespace App {
        interface Locals {
            user: { id: string; email: string } | null;
            token?: string;
            accessToken?: string;
        }
    }
}

export {};