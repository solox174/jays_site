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
export const amplifyClient = new Proxy(client, {
    get(target, prop, receiver) {
        // Symbol keys bypass the proxy — trapping them breaks internal JS operations
        // like iteration protocols and Symbol.toPrimitive that the client uses internally.
        if (typeof prop === 'symbol') {
            return Reflect.get(target, prop, receiver);
        }
        const value = Reflect.get(target, prop, receiver);

        if (typeof value !== 'function') return value;

        return async (...args: unknown[]) => {
            const {data, errors} = await (value as Function).apply(target, args);
            if (errors?.length || !data) throw new Error(errors?.map((e: Error) => e.message).join(', ') ?? '');
            return {data};
        };
    }
});