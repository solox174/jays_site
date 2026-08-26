-- Postgres schema mirroring the Amplify Data model in amplify/data/resource.ts.
-- Run once against a fresh database via scripts/postgresMigrate.ts.
create extension if not exists pgcrypto;

create table if not exists customers (
    id text primary key default gen_random_uuid()::text,
    first_name text,
    last_name text not null,
    phone_number text not null,
    email text not null,
    password text not null
);

-- One login per email — needed by the native Postgres auth service to look a customer
-- up by email at login time (Cognito enforces this itself, so this constraint only
-- matters when auth/postgres/authService.ts is the active implementation).
alter table customers add constraint customers_email_unique unique (email);

create table if not exists vehicle_specs (
    id text primary key default gen_random_uuid()::text,
    year text not null,
    make text not null,
    model text not null
);

create table if not exists services (
    id text primary key default gen_random_uuid()::text,
    name text not null,
    description text not null,
    service_type text not null
);

create table if not exists service_prices (
    id text primary key default gen_random_uuid()::text,
    service_id text not null references services(id) on delete cascade,
    vehicle_category text not null,
    price double precision not null
);

create table if not exists appointments (
    id text primary key default gen_random_uuid()::text,
    customer_id text not null references customers(id) on delete cascade,
    vehicle_id text not null references vehicle_specs(id) on delete cascade,
    date timestamptz not null
);

create table if not exists appointment_services (
    id text primary key default gen_random_uuid()::text,
    appointment_id text not null references appointments(id) on delete cascade,
    service_id text not null references services(id) on delete cascade
);

-- Mirrors the DynamoDB GoogleReviewsCache model (amplify/data/resource.ts) — a single
-- fixed row caching the last successful Google Places API response. See
-- src/lib/server/storage/postgres/reviewsCacheStore.ts.
create table if not exists google_reviews_cache (
    id text primary key,
    payload text not null,
    fetched_at timestamptz not null
);

-- Owned entirely by auth/postgres/authService.ts — deliberately not exposed through
-- CustomerRepository/Customer, since verification state is an auth concern, not domain
-- data the rest of the app should ever need to read or write.
create table if not exists email_verifications (
    customer_id text primary key references customers(id) on delete cascade,
    verified boolean not null default false,
    code text,
    code_expires_at timestamptz
);

-- Opaque server-verified sessions, the Postgres-native alternative to Cognito's
-- self-contained JWTs — a DB lookup per request instead of signature verification,
-- trading a small amount of latency for not needing a signing-key secret at all.
create table if not exists sessions (
    token text primary key,
    customer_id text not null references customers(id) on delete cascade,
    expires_at timestamptz not null
);
