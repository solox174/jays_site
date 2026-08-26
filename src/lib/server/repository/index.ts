// Both platforms' implementations are imported unconditionally so detectPlatform() can
// pick between them at runtime — see platform.ts for why, and postgres/db.ts for how
// the Postgres side avoids failing just from being imported on an AWS deployment.
import {customerRepository as amplifyCustomerRepository} from './amplify/customerRepository';
import {appointmentRepository as amplifyAppointmentRepository} from './amplify/appointmentRepository';
import {vehicleRepository as amplifyVehicleRepository} from './amplify/vehicleRepository';
import {serviceRepository as amplifyServiceRepository} from './amplify/serviceRepository';
import {appointmentServiceRepository as amplifyAppointmentServiceRepository} from './amplify/appointmentServiceRepository';
import {postgresCustomerRepository} from './postgres/customerRepository';
import {postgresAppointmentRepository} from './postgres/appointmentRepository';
import {postgresVehicleRepository} from './postgres/vehicleRepository';
import {postgresServiceRepository} from './postgres/serviceRepository';
import {postgresAppointmentServiceRepository} from './postgres/appointmentServiceRepository';
import {withLogging} from './withLogging';
import {detectPlatform} from '$lib/server/platform';

const platform = detectPlatform();

const impl = platform === 'vercel'
    ? {
        customers: postgresCustomerRepository,
        appointments: postgresAppointmentRepository,
        vehicles: postgresVehicleRepository,
        services: postgresServiceRepository,
        appointmentServices: postgresAppointmentServiceRepository
    }
    : {
        customers: amplifyCustomerRepository,
        appointments: amplifyAppointmentRepository,
        vehicles: amplifyVehicleRepository,
        services: amplifyServiceRepository,
        appointmentServices: amplifyAppointmentServiceRepository
    };

// Logging is applied here rather than inside each repository so the repos stay
// focused on data access. This is the single assembly point for the repository layer.
export const repositories = {
    customers: withLogging(impl.customers, 'customerRepository'),
    appointments: withLogging(impl.appointments, 'appointmentRepository'),
    vehicles: withLogging(impl.vehicles, 'vehicleRepository'),
    services: withLogging(impl.services, 'serviceRepository'),
    appointmentServices: withLogging(impl.appointmentServices, 'appointmentServiceRepository')
};
