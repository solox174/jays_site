// To swap backends: replace these imports with a different implementation folder
// (e.g. './postgres/customerRepository') — no other files need to change.
import {customerRepository} from './amplify/customerRepository';
import {appointmentRepository} from './amplify/appointmentRepository';
import {vehicleRepository} from './amplify/vehicleRepository';
import {serviceRepository} from './amplify/serviceRepository';
import {appointmentServiceRepository} from './amplify/appointmentServiceRepository';
import {withLogging} from './withLogging';

// Logging is applied here rather than inside each repository so the repos stay
// focused on data access. This is the single assembly point for the repository layer.
export const repositories = {
    customers: withLogging(customerRepository, 'customerRepository'),
    appointments: withLogging(appointmentRepository, 'appointmentRepository'),
    vehicles: withLogging(vehicleRepository, 'vehicleRepository'),
    services: withLogging(serviceRepository, 'serviceRepository'),
    appointmentServices: withLogging(appointmentServiceRepository, 'appointmentServiceRepository')
};