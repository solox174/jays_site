import {logger} from '$lib/server/logger';

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