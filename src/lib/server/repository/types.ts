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
}

export interface VehicleRepository extends Repository<VehicleSpec> {
    findOrCreate(year: string, make: string, model: string): Promise<VehicleSpec>;
}

export interface ServiceRepository extends Repository<Service> {

    // TODO: (NEXT) add method `async getByIds(serviceIds: string[])` and query by ids
    //       change getById() so it calls getByIds by wrapping the single id in an array.
    //       Then implement in serviceRepository.ts
    //       this is called a "delegation pattern".
    listPrices(): Promise<ServicePrice[]>;
}

export interface AppointmentServiceRepository {
    createMany(appointmentId: string, serviceIds: string[]): Promise<void>;
}