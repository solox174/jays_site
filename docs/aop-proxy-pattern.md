# AOP via JavaScript Proxy

## What it is

Aspect-Oriented Programming (AOP) is a technique for separating **cross-cutting concerns** — logic that needs to apply across many places (logging, error handling, timing) — from the code those places are actually responsible for.

In Java/Spring you'd use `@Around` pointcuts. In this codebase we use JavaScript's built-in `Proxy` object to achieve the same thing.

## The pattern

```typescript
export function withLogging<T extends object>(repo: T, name: string): T {
    return new Proxy(repo, {
        get(target, prop) {
            const value = target[prop as keyof T];
            if (typeof value !== 'function') return value;
            return async (...args: unknown[]) => {
                try {
                    return await (value as Function).apply(target, args);
                } catch (e) {
                    logger.error(`${name}.${String(prop)} failed: ${e}`);
                    throw e;
                }
            };
        }
    });
}
```

`Proxy` intercepts property access on an object. When the accessed property is a function, we replace it with a wrapper that:
1. Calls the original method
2. Logs any error
3. Re-throws so the caller can decide what to do

The caller never knows it's talking to a proxy — the interface is identical.

## AOP terminology

| Term | Meaning here |
|------|-------------|
| **Aspect** | `withLogging` — the cross-cutting concern |
| **Pointcut** | "all methods on this repository object" |
| **Join point** | Each individual method call at runtime |
| **Advice** | The try/catch/log block — the code that runs *around* the method |
| **Around advice** | Wrapping before AND after (what try/catch does) |

## How it's used

All repositories are wrapped at the assembly point (`repository/index.ts`):

```typescript
export const repositories = {
    customers: withLogging(customerRepository, 'customerRepository'),
    appointments: withLogging(appointmentRepository, 'appointmentRepository'),
    ...
};
```

## What it does and doesn't do

**Does:**
- Automatically logs every repository failure with the repository and method name
- Re-throws the original error unchanged

**Doesn't:**
- Decide whether an error is fatal — that's the route's job
- Swallow errors or return fallback values

## Decision about fatal vs recoverable

That decision is made in the calling route using SvelteKit's helpers:

```typescript
// In +page.server.ts load — fatal, can't render the page
try {
    const services = await repositories.services.list();
} catch (e) {
    error(500, 'Failed to load services'); // renders +error.svelte
}

// In an action — non-fatal, form stays up
try {
    await repositories.appointments.createAppointment(...);
} catch (e) {
    return fail(500, { message: 'Booking failed. Please try again.' });
}
```

This keeps the data layer ignorant of routing concerns, and keeps routing decisions close to the UI where context is available.