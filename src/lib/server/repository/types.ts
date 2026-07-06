import type {ServiceType} from "$lib/types";

export type VehicleCategory = 'coupe' | 'sedan' | 'van' | 'suv' | 'jeep' | 'truck';
export interface Customer {
    id: string;
    firstName?: string | null;
    lastName: string;
    phoneNumber: string;
    email: string;
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
interface Repository<T> {
    getById(id: string): Promise<T | null>;
    list(): Promise<T[] | null>;
    create(obj: Omit<T, 'id'>): Promise<T | null>;
    delete(id: string): void;
}

export interface CustomerRepository extends Repository<Customer>{
    create(obj: Omit<Customer, 'id'> & { id?: string }): Promise<Customer>;
}

export interface AppointmentRepository extends Repository<Appointment> {
    createAppointment(appointment: Omit<Appointment, 'id'>, appointmentServices: string[]): Promise<Appointment>;
    getServices(appointmentId: string): Promise<Service[]>;
}

export interface VehicleRepository extends Repository<VehicleSpec> {
    findOrCreate(year: string, make: string, model: string): Promise<VehicleSpec>;
}

export interface ServiceRepository extends Repository<Service> {
    getByIds(serviceIds: string[]): Promise<Service[]>;
    listPrices(): Promise<ServicePrice[]>;
}

export interface AppointmentServiceRepository {
    createMany(appointmentId: string, serviceIds: string[]): Promise<void>;
}