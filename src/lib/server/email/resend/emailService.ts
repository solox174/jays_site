import {Resend} from 'resend';
import {emailConfig} from '../config';
import type {EmailService} from '../types';

// Plain process.env, not $env/dynamic|static/private:
//  - NOT $env/static/private, which is inlined at build time. This module is imported
//    unconditionally by email/index.ts's platform selector alongside the SES
//    implementation, so an AWS-platform deployment with no RESEND_API_KEY configured
//    must not fail just from importing this file.
//  - NOT $env/dynamic/private — on Amplify, SvelteKit's Server.init() snapshots that
//    module's contents from process.env *before* hooks.server.ts (which merges the
//    build-resolved .env — see scripts/writeRuntimeEnv.js) even runs, since hooks are
//    loaded via a lazy dynamic import from inside init(). Plain process.env is read live
//    on every call, so it sees hooks.server.ts's merge; $env/dynamic/private never would.
// Client construction stays lazy so we only throw if this implementation is actually
// invoked. On Vercel real env vars are already in process.env directly — no merge needed.
let resend: Resend | undefined;

function getClient(): Resend {
    if (!resend) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not set — is the Resend email service actually meant to be active here?');
        }
        resend = new Resend(apiKey);
    }
    return resend;
}

export const resendEmailService: EmailService = {
    async send(to: string, subject: string, body: string, from?: string): Promise<void> {
        const {error} = await getClient().emails.send({
            from: from ?? emailConfig.fromAddress,
            to,
            subject,
            text: body
        });

        if (error) throw new Error(`Resend send failed: ${error.message}`);
    }
};
