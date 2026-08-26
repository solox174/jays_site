// Shared across providers — not provider-specific secrets, which live in each
// provider's own implementation file and are read lazily (see resend/emailService.ts
// and platform.ts for why: this module is imported unconditionally by both provider
// implementations regardless of which one is actually selected).
export const emailConfig = {
    fromAddress: 'appointments@jaysautosdetailing.com'
};
