import {Resend} from 'resend';
import {env} from '$env/dynamic/private';
import {emailConfig} from '../config';
import type {EmailService} from '../types';

// $env/dynamic/private — deliberately neither of the obvious alternatives:
//  - NOT $env/static/private, which is inlined at build time. This module is imported
//    unconditionally by email/index.ts's platform selector alongside the SES
//    implementation, so an AWS-platform deployment with no RESEND_API_KEY configured
//    must not fail just from importing this file.
//  - NOT plain process.env, which Vite/SvelteKit never populate from .env files —
//    SvelteKit calls Vite's loadEnv() and exposes the result through these virtual
//    modules without ever mutating process.env, so `vite dev` reads undefined even with
//    the key sitting in .env.local.
// dynamic/private covers both: .env files in dev, real process.env at runtime. Client
// construction stays lazy so we only throw if this implementation is actually invoked.
// (On Vercel, the actual target platform for this provider, runtime env vars are
// propagated correctly — unlike Amplify Hosting, see platform.ts.)
let resend: Resend | undefined;

function getClient(): Resend {
    if (!resend) {
        const apiKey = env.RESEND_API_KEY;
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
