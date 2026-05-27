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
    isExclusive: boolean;
}

export interface ServicePrice {
    id: string;
    serviceId: string;
    vehicleCategory: VehicleCategory;
    price: number;
}

export interface CustomerRepository {
    create(customer: Customer): Promise<Customer>;
    getById(id: string): Promise<Customer | null>;
}

export interface AppointmentRepository {
    list(): Promise<Appointment[]>;
    create(appointment: Omit<Appointment, 'id'>): Promise<Appointment>;
}

export interface VehicleRepository {
    findOrCreate(year: string, make: string, model: string): Promise<VehicleSpec>;
}

export interface ServiceRepository {
    list(): Promise<Service[]>;
    listPrices(): Promise<ServicePrice[]>;
}

export interface AppointmentServiceRepository {
    createMany(appointmentId: string, serviceIds: string[]): Promise<void>;
}