// Jay's Auto Detailing and its customers are all in Phoenix, AZ. Arizona doesn't observe
// Daylight Saving Time, so this zone's UTC offset never changes — but that alone doesn't
// make plain Date methods (getHours, setHours, etc.) safe to use for appointment times.
// Those read/write whatever timezone the *running machine* is in, which differs between
// the customer's browser and the Lambda (always UTC) — that mismatch is exactly what
// caused booked slots to silently not block overlapping bookings in production. Every
// appointment date must be constructed and read back explicitly against
// BUSINESS_TIMEZONE via Intl, never via a machine-local Date method.
//
// Isomorphic (no server-only APIs) — Intl.DateTimeFormat with a `timeZone` works
// natively in both Node and every modern browser, so this is imported from both server
// code (scheduling/+page.server.ts, appointmentEmails.ts) and client components
// (TimePickerModal.svelte).
//
// $env/static/public, not private: this reads client-side too (TimePickerModal needs it
// to interpret appointment dates correctly regardless of the browser's own timezone),
// and a timezone name isn't sensitive. Configurable per deployment — this project is a
// reusable template (see docs) — set PUBLIC_BUSINESS_TIMEZONE to whatever IANA zone the
// next business using this template operates in; zonedTimeToUtc below handles real DST
// zones correctly too, not just Phoenix's fixed offset.
import {PUBLIC_BUSINESS_TIMEZONE} from '$env/static/public';

export const BUSINESS_TIMEZONE = PUBLIC_BUSINESS_TIMEZONE;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
});

export type ZonedParts = {
    year: number;
    month: number; // 0-indexed, matching Date's own convention
    day: number;
    hour: number;
    minute: number;
};

// What year/month/day/hour/minute does a clock in BUSINESS_TIMEZONE show for this UTC
// instant? Use this instead of date.getFullYear()/getHours()/etc, which read whichever
// machine happens to be running the code, not the business's timezone.
export function getZonedParts(date: Date): ZonedParts {
    const parts = Object.fromEntries(partsFormatter.formatToParts(date).map(p => [p.type, p.value]));
    return {
        year: Number(parts.year),
        month: Number(parts.month) - 1,
        day: Number(parts.day),
        hour: Number(parts.hour),
        minute: Number(parts.minute)
    };
}

// Given wall-clock components as they'd read on a clock in BUSINESS_TIMEZONE, return the
// UTC instant they correspond to. Works correctly for any IANA zone (handles DST via the
// real tz database), not just Phoenix's fixed offset — reusable if this template is ever
// deployed for a business somewhere that does observe DST.
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
    const utcGuess = Date.UTC(year, month, day, hour, minute);
    const asReadInZone = getZonedParts(new Date(utcGuess));
    const offset = utcGuess - Date.UTC(asReadInZone.year, asReadInZone.month, asReadInZone.day, asReadInZone.hour, asReadInZone.minute);
    return new Date(utcGuess + offset);
}

// Do these two UTC instants fall on the same calendar day in BUSINESS_TIMEZONE?
export function isSameBusinessDay(a: Date, b: Date): boolean {
    const pa = getZonedParts(a);
    const pb = getZonedParts(b);
    return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}
