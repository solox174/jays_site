import {EMAIL_FROM_ADDRESS, EMAIL_CONFIRMATION_FROM_ADDRESS} from '$env/static/private';

// Shared across providers — not provider-specific secrets, which live in each
// provider's own implementation file and are read lazily (see resend/emailService.ts
// and platform.ts for why: this module is imported unconditionally by both provider
// implementations regardless of which one is actually selected).
//
// $env/static/private, not process.env: these are non-secret, per-deployment config
// (a new client just needs their own verified sending domain), not Console-overridable
// secrets — no need for the raw process.env + hooks.server.ts merge machinery reserved
// for values like RESEND_API_KEY. Static env is inlined at build time and works
// identically on both platforms with zero extra plumbing.
export const emailConfig = {
    fromAddress: EMAIL_FROM_ADDRESS,
    confirmationFromAddress: EMAIL_CONFIRMATION_FROM_ADDRESS
};
