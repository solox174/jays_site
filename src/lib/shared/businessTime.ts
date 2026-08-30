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
// next business using this template operates in; TZDate handles real DST zones
// correctly (via @date-fns/tz, not hand-rolled), not just Phoenix's fixed offset.
import {PUBLIC_BUSINESS_TIMEZONE} from '$env/static/public';
import {TZDate} from '@date-fns/tz';

export const BUSINESS_TIMEZONE = PUBLIC_BUSINESS_TIMEZONE;

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
    const zoned = new TZDate(date, BUSINESS_TIMEZONE);
    return {
        year: zoned.getFullYear(),
        month: zoned.getMonth(),
        day: zoned.getDate(),
        hour: zoned.getHours(),
        minute: zoned.getMinutes()
    };
}

// Given wall-clock components as they'd read on a clock in BUSINESS_TIMEZONE, return the
// UTC instant they correspond to. Handles DST correctly (via @date-fns/tz's real tz
// database), not just Phoenix's fixed offset — reusable if this template is ever
// deployed for a business somewhere that does observe DST.
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
    return new Date(new TZDate(year, month, day, hour, minute, BUSINESS_TIMEZONE).getTime());
}

export type CalendarDay = {
    year: number;
    month: number; // 0-indexed, matching Date's own convention
    day: number;
};

// A calendar day the customer picked (e.g. from a date picker) is a plain, timezone-free
// concept — "August 31st" — until it's combined with a time via zonedTimeToUtc. Round-
// tripping it through a real Date instant + timezone reinterpretation first (e.g.
// `new Date(y,m,d).toISOString()` then reading it back with getZonedParts) can shift it
// onto the *previous* calendar day if the browser's own timezone sits far enough ahead
// of BUSINESS_TIMEZONE (exactly what broke booked-slot blocking for anyone testing this
// app from outside Phoenix). Always transmit/parse a picked day as a plain "YYYY-MM-DD"
// string via this function instead — it never touches Date or Intl at all.
export function parseCalendarDay(value: string): CalendarDay | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return null;
    return {year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3])};
}

export function isSameCalendarDay(a: CalendarDay, b: CalendarDay): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day;
}
