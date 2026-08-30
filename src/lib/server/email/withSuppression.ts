// AOP proxy (same rationale as storage/withLogging.ts): suppressing sends is a
// cross-cutting concern applied at the assembly point (index.ts), so it applies to
// whichever EmailService implementation is active and to every future call site,
// without each one needing its own SUPPRESS_EMAIL check.
export function withSuppression<T extends object>(impl: T): T {
    return new Proxy(impl, {
        get(target, prop) {
            const value = target[prop as keyof T];
            if (typeof value !== 'function') return value;
            return async (...args: unknown[]) => {
                if (process.env.SUPPRESS_EMAIL?.toLowerCase() === 'true') return;
                return await (value as Function).apply(target, args);
            };
        }
    });
}
