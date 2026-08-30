import pino from 'pino';

// Amplify's compute Lambda freezes the process right after a response is sent. Pino's
// default destination buffers writes asynchronously for throughput, so a log call made
// just before returning can be lost when the freeze lands before the buffer flushes —
// this is why logger.* calls never showed up in CloudWatch. sync: true forces a blocking
// write instead, so nothing gets lost.
export const logger = import.meta.env.DEV
    ? pino({ transport: { target: 'pino-pretty' } })
    : pino({}, pino.destination({ dest: 1, sync: true }));
