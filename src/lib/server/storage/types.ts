import type {ServiceType} from "$lib/types";
import type {PlaceReviews} from "$lib/server/api/types";

export type VehicleCategory = 'coupe' | 'sedan' | 'van' | 'suv' | 'jeep' | 'truck';
// Not a boolean: same implementation cost today, avoids a real migration if a third
// role type is ever needed (this is a reusable template — see project intent docs).
export type UserRole = 'customer' | 'admin';
export interface Customer {
    id: string;
    firstName?: string | null;
    lastName: string;
    phoneNumber: string;
    email: string;
    role: UserRole;
}

export interface Appointment {
    id: string;
    customerId: string;
    vehicleId: string;
    date: string;
}

export interface VehicleSpec {
    id: string;
    year: string;
    make: string;
    model: string;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    serviceType: ServiceType;
}

export interface ServicePrice {
    id: string;
    serviceId: string;
    vehicleCategory: VehicleCategory;
    price: number;
}

// Repository pattern (DDD): abstracts the data store behind a domain-oriented
// interface so the rest of the app has no dependency on Amplify or DynamoDB.
// Swapping backends only requires new implementations in a sibling folder.
// Named "Domain"Repository specifically to distinguish it from ReviewsCacheStore below —
// both live here because they're both storage-layer things wrapping a table, but they
// aren't the same kind of thing: this one is for business entities with CRUD lifecycles,
// ReviewsCacheStore is a single-row cache with get/touch/set semantics.
interface DomainRepository<T> {
    getById(id: string): Promise<T | null>;
    list(): Promise<T[] | null>;
    create(obj: Omit<T, 'id'>): Promise<T | null>;
    delete(id: string): void;
}

export interface CustomerRepository extends DomainRepository<Customer>{
    // role omitted: every new customer starts as 'customer', set by the implementation
    // itself — not something callers (signup, deferred first-login creation) should
    // need to know or pass. Use update() to change it later.
    create(obj: Omit<Customer, 'id' | 'role'> & { id?: string }): Promise<Customer>;
    update(id: string, updates: Partial<Omit<Customer, 'id'>>): Promise<Customer>;
}

export interface AppointmentRepository extends DomainRepository<Appointment> {
    createAppointment(appointment: Omit<Appointment, 'id'>, appointmentServices: string[]): Promise<Appointment>;
    getServices(appointmentId: string): Promise<Service[]>;
}

export interface VehicleRepository extends DomainRepository<VehicleSpec> {
    findOrCreate(year: string, make: string, model: string): Promise<VehicleSpec>;
}

export interface ServiceRepository extends DomainRepository<Service> {
    getByIds(serviceIds: string[]): Promise<Service[]>;
    update(id: string, updates: Partial<Omit<Service, 'id'>>): Promise<Service>;
    listPrices(): Promise<ServicePrice[]>;
    // Updates the existing ServicePrice row for this (serviceId, vehicleCategory) pair,
    // or creates one if none exists yet.
    upsertPrice(serviceId: string, vehicleCategory: VehicleCategory, price: number): Promise<ServicePrice>;
}

export interface AppointmentServiceRepository {
    createMany(appointmentId: string, serviceIds: string[]): Promise<void>;
}

export interface CachedReviewsEntry {
    // null on the very first-ever fetch, when the row has been claimed (see touch())
    // but no successful payload has landed yet.
    data: PlaceReviews | null;
    fetchedAt: number;
}

// Backs the caching AOP proxy (withCache.ts). Same swappable-backend rationale as the
// repositories above — DynamoDB/Postgres are two possible backing stores, not the only
// ones — even though this isn't a DomainRepository itself (see the comment above it).
export interface ReviewsCacheStore {
    // Returns null only if no row exists yet — otherwise returns the entry regardless
    // of age, so withCache.ts can decide staleness and fall back to serving it if a
    // refresh attempt fails.
    get(): Promise<CachedReviewsEntry | null>;
    // Stamps fetchedAt = now without touching the payload. Called right before making
    // the paid API call, so a concurrent request that reads the cache a moment later
    // sees a fresh entry and skips its own call — see withCache.ts.
    touch(): Promise<void>;
    set(data: PlaceReviews): Promise<void>;
}
