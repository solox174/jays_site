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

-- Toggled directly via the Neon SQL console — no in-app role-management UI. See
-- src/routes/admin/+layout.server.ts for how this gates /admin/*. A separate ALTER
-- rather than a column in the CREATE TABLE above, since create table if not exists is a
-- no-op against an already-migrated database and wouldn't add this column retroactively.
alter table customers add column if not exists role text not null default 'customer';
alter table customers add constraint customers_role_check check (role in ('customer', 'admin'));

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

-- One price per (service, vehicle category) — lets upsertPrice() use ON CONFLICT
-- instead of a manual check-then-write. See postgres/serviceRepository.ts.
alter table service_prices add constraint service_prices_unique_service_category unique (service_id, vehicle_category);

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

-- Expired-row cleanup: tried pg_cron (it lists as available via pg_available_extensions
-- on this Neon project), but actually enabling it requires creating the extension from
-- Neon's separate `postgres` system database, which the neondb_owner role isn't
-- permitted to do — "permission denied to create extension pg_cron", confirmed by
-- hand. Possibly resolvable via Neon's dashboard/support, but not from plain SQL with
-- this role. Cleanup is instead a probabilistic sweep in application code — see
-- getSessionCustomerId() in auth/postgres/authService.ts.
