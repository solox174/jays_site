import {Amplify} from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
import {generateClient} from 'aws-amplify/data';
import type {Schema} from '../../../amplify/data/resource';

Amplify.configure(outputs, {ssr: true});
const client = generateClient<Schema>();

// AOP (Aspect-Oriented Programming) proxy: intercepts every method call on the
// Amplify client to centralize a cross-cutting concern — error normalization
// — so repositories don't have to repeat try/catch boilerplate.
//
// Amplify's generated client returns {data, errors} instead of throwing, so the
// proxy converts that into a standard throw, letting callers use normal async/await.
//
// The handler is extracted into a named function so it can recurse into nested
// objects (e.g. client.models.Customer.get) — without this, returning a plain
// object for non-function values causes nested method calls to bypass the proxy.
function makeProxy<T extends object>(target: T): T {
    return new Proxy(target, {
        get(target, prop, receiver) {
            // Symbol keys bypass the proxy — trapping them breaks internal JS operations
            // like iteration protocols and Symbol.toPrimitive that the client uses internally.
            if (typeof prop === 'symbol') {
                return Reflect.get(target, prop, receiver);
            }
            const value = Reflect.get(target, prop, receiver);

            if (typeof value === 'function') {
                return async (...args: unknown[]) => {
                    const {data, errors} = await (value as Function).apply(target, args);
                    if (errors?.length || !data) throw new Error(errors?.map((e: Error) => e.message).join(', ') ?? '');
                    return {data};
                };
            }

            if (typeof value === 'object' && value !== null) {
                return makeProxy(value);
            }

            return value;
        }
    });
}

export const amplifyClient = makeProxy(client);