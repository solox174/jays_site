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
