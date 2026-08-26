import {sesEmailService} from './ses/emailService';
import {resendEmailService} from './resend/emailService';
import {detectPlatform} from '$lib/server/platform';
import type {EmailService} from './types';

// Picked per-platform rather than a single hardcoded import — see platform.ts. To add
// a third provider: implement EmailService in a sibling folder and add it here.
const implementations: Record<ReturnType<typeof detectPlatform>, EmailService> = {
    aws: sesEmailService,
    vercel: resendEmailService
};

export const emailService: EmailService = implementations[detectPlatform()];
