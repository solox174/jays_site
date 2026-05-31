// To swap backends: replace these imports with a different implementation folder
// (e.g. './postgres/customerRepository') — no other files need to change.
import {customerRepository} from './amplify/customerRepository';
import {appointmentRepository} from './amplify/appointmentRepository';
import {vehicleRepository} from './amplify/vehicleRepository';
import {serviceRepository} from './amplify/serviceRepository';
import {appointmentServiceRepository} from './amplify/appointmentServiceRepository';
import {withLogging} from './withLogging';

export const repositories = {
    customers: withLogging(customerRepository, 'customerRepository'),
    appointments: withLogging(appointmentRepository, 'appointmentRepository'),
    vehicles: withLogging(vehicleRepository, 'vehicleRepository'),
    services: withLogging(serviceRepository, 'serviceRepository'),
    appointmentServices: withLogging(appointmentServiceRepository, 'appointmentServiceRepository')
};