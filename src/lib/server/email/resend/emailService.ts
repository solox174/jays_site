import {Resend} from 'resend';
import {emailConfig} from '../config';
import type {EmailService} from '../types';

// Lazy, plain process.env — not $env/static/private. This module is imported
// unconditionally by email/index.ts's platform selector alongside the SES
// implementation, so an AWS-platform deployment with no RESEND_API_KEY configured
// must not fail just from importing this file. Only throw if this implementation is
// actually invoked. (On Vercel, the actual target platform for this provider, runtime
// env vars are propagated correctly — unlike Amplify Hosting, see platform.ts.)
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
    async send(to: string, subject: string, body: string): Promise<void> {
        const {error} = await getClient().emails.send({
            from: emailConfig.fromAddress,
            to,
            subject,
            text: body
        });

        if (error) throw new Error(`Resend send failed: ${error.message}`);
    }
};
