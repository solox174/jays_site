import {sesEmailService} from './ses/emailService';
import {resendEmailService} from './resend/emailService';
import {detectPlatform} from '$lib/server/platform';
import {withSuppression} from './withSuppression';
import type {EmailService} from './types';

// Picked per-platform rather than a single hardcoded import — see platform.ts. To add
// a third provider: implement EmailService in a sibling folder and add it here.
const implementations: Record<ReturnType<typeof detectPlatform>, EmailService> = {
    aws: sesEmailService,
    vercel: resendEmailService
};

// TEMPORARY: forcing Resend on both platforms. Cognito still sends its own
// account-confirmation codes on AWS untouched (auth/cognito/authService.ts never calls
// this module) — this only affects appointment notifications (appointmentEmails.ts).
// Those are blocked on AWS by SES's sandbox restriction (can only send to verified
// recipients) pending a still-unresolved AWS support request. AWS's free tier is
// preferred over Resend long-term, so once SES is unblocked, revert to
// `implementations[detectPlatform()]` below rather than deleting it.
export const emailService: EmailService = withSuppression(resendEmailService);
// export const emailService: EmailService = withSuppression(implementations[detectPlatform()]);
